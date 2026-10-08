import React, { useState, useEffect, useRef, useCallback } from "react";
import "./ChessTimer.css";

// Preset Turnamen Populer (waktu awal dalam detik, increment dalam detik)
const PRESETS = [
  { name: "1 min", time: 60, inc: 0, tag: "Bullet" },
  { name: "1 | 1", time: 60, inc: 1, tag: "Bullet" },
  { name: "2 | 1", time: 120, inc: 1, tag: "Bullet" },
  { name: "3 min", time: 180, inc: 0, tag: "Blitz" },
  { name: "3 | 2", time: 180, inc: 2, tag: "Blitz" },
  { name: "5 min", time: 300, inc: 0, tag: "Blitz" },
  { name: "5 | 3", time: 300, inc: 3, tag: "Blitz" },
  { name: "10 min", time: 600, inc: 0, tag: "Rapid" },
  { name: "15 | 10", time: 900, inc: 10, tag: "Rapid" },
  { name: "30 min", time: 1800, inc: 0, tag: "Classical" },
];

export default function ChessTimer() {
  // Pengaturan Waktu
  const [baseTime, setBaseTime] = useState(300); // 5 Menit
  const [increment, setIncrement] = useState(0);

  // Status Permainan
  const [timeWhite, setTimeWhite] = useState(300000); // dalam milidetik
  const [timeBlack, setTimeBlack] = useState(300000);
  const [activePlayer, setActivePlayer] = useState(null); // 'white', 'black', atau null
  const [movesWhite, setMovesWhite] = useState(0);
  const [movesBlack, setMovesBlack] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [winner, setWinner] = useState(null); // 'white', 'black', atau null

  // Preferensi UI & UX
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFaceToFace, setIsFaceToFace] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Form custom modal
  const [customMin, setCustomMin] = useState(5);
  const [customSec, setCustomSec] = useState(0);
  const [customInc, setCustomInc] = useState(3);

  // Audio Context Ref
  const audioCtxRef = useRef(null);
  const lastTickTimeRef = useRef(null);

  // Inisialisasi Audio Synthesizer (Web Audio API murni)
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  };

  const playSound = useCallback(
    (type) => {
      if (!soundEnabled) return;
      try {
        initAudio();
        const ctx = audioCtxRef.current;
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        const now = ctx.currentTime;

        if (type === "click") {
          // Suara saklar jam mekanik kayu
          osc.type = "triangle";
          osc.frequency.setValueAtTime(620, now);
          osc.frequency.exponentialRampToValueAtTime(140, now + 0.045);
          gain.gain.setValueAtTime(0.35, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
          osc.start(now);
          osc.stop(now + 0.05);
        } else if (type === "warning") {
          // Peringatan waktu sekarat
          osc.type = "sine";
          osc.frequency.setValueAtTime(880, now);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          osc.start(now);
          osc.stop(now + 0.09);
        } else if (type === "timeout") {
          // Alarm bendera waktu habis
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.linearRampToValueAtTime(220, now + 0.4);
          gain.gain.setValueAtTime(0.4, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
          osc.start(now);
          osc.stop(now + 0.45);
        }
      } catch {
        // Audio fallback jika browser memblokir autoplay
      }
    },
    [soundEnabled],
  );

  // Main Loop Timer dengan Presisi Tinggi
  useEffect(() => {
    let animId;
    if (!isPaused && activePlayer && !winner) {
      lastTickTimeRef.current = performance.now();

      const updateClock = (now) => {
        const delta = now - (lastTickTimeRef.current || now);
        lastTickTimeRef.current = now;

        if (activePlayer === "white") {
          setTimeWhite((prev) => {
            const next = prev - delta;
            if (next <= 0) {
              setWinner("black");
              setIsPaused(true);
              playSound("timeout");
              return 0;
            }
            return next;
          });
        } else if (activePlayer === "black") {
          setTimeBlack((prev) => {
            const next = prev - delta;
            if (next <= 0) {
              setWinner("white");
              setIsPaused(true);
              playSound("timeout");
              return 0;
            }
            return next;
          });
        }

        animId = requestAnimationFrame(updateClock);
      };

      animId = requestAnimationFrame(updateClock);
    }

    return () => cancelAnimationFrame(animId);
  }, [isPaused, activePlayer, winner, playSound]);

  // Handle Switch Turn
  const handlePlayerTap = (player) => {
    initAudio();
    if (winner) return;

    // Jika timer masih belum mulai, tap pertama memulai giliran lawan
    if (activePlayer === null) {
      if (player === "white") {
        setActivePlayer("black");
        setMovesWhite(1);
      } else {
        setActivePlayer("white");
        setMovesBlack(1);
      }
      setIsPaused(false);
      playSound("click");
      return;
    }

    // Hanya jam pemain yang sedang aktif yang merespon tap untuk mengoper giliran
    if (player === activePlayer && !isPaused) {
      if (player === "white") {
        setTimeWhite((t) => t + increment * 1000);
        setMovesWhite((m) => m + 1);
        setActivePlayer("black");
      } else {
        setTimeBlack((t) => t + increment * 1000);
        setMovesBlack((m) => m + 1);
        setActivePlayer("white");
      }
      playSound("click");
    }
  };

  // Kontrol Game
  const togglePause = () => {
    if (winner) return;
    initAudio();
    if (activePlayer === null) {
      setActivePlayer("white");
      setIsPaused(false);
    } else {
      setIsPaused(!isPaused);
    }
  };

  const resetGame = (timeSec = baseTime, incSec = increment) => {
    setBaseTime(timeSec);
    setIncrement(incSec);
    setTimeWhite(timeSec * 1000);
    setTimeBlack(timeSec * 1000);
    setMovesWhite(0);
    setMovesBlack(0);
    setActivePlayer(null);
    setIsPaused(true);
    setWinner(null);
  };

  const applyCustomTime = (e) => {
    e.preventDefault();
    const totalSec = Math.max(
      1,
      parseInt(customMin || 0, 10) * 60 + parseInt(customSec || 0, 10),
    );
    const inc = Math.max(0, parseInt(customInc || 0, 10));
    resetGame(totalSec, inc);
    setShowSettings(false);
  };

  // Keyboard Shortcuts (Space: Pause, A: White, L: Black, R: Reset)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showSettings) return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePause();
      } else if (e.code === "KeyA" || e.code === "ArrowDown") {
        handlePlayerTap("white");
      } else if (e.code === "KeyL" || e.code === "ArrowUp") {
        handlePlayerTap("black");
      } else if (e.code === "KeyR") {
        resetGame();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPaused, activePlayer, winner, showSettings]);

  // Format Tampilan Waktu Monospace
  const formatTime = (ms) => {
    if (ms <= 0) return "00:00.0";
    const totalSec = ms / 1000;
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = Math.floor(totalSec % 60);
    const tenths = Math.floor((ms % 1000) / 100);

    const pad = (n) => String(n).padStart(2, "0");

    // Menampilkan desimal jika waktu kurang dari 20 detik
    if (totalSec < 20) {
      return `${pad(mins)}:${pad(secs)}.${tenths}`;
    }
    if (hours > 0) {
      return `${hours}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  return (
    <div className="chess-app">
      {/* AREA PEMAIN HITAM (SISI ATAS) */}
      <section
        className={`clock-card black-card ${activePlayer === "black" && !isPaused ? "active" : ""} ${
          isFaceToFace ? "rotated" : ""
        } ${winner === "white" ? "flagged" : ""}`}
        onClick={() => handlePlayerTap("black")}
      >
        <div className="card-topbar">
          <span className="player-badge">
            <span className="dot dot-black"></span> Hitam
          </span>
          <span className="move-counter">Langkah: {movesBlack}</span>
        </div>

        <div className="display-wrapper">
          <span className={`time-text ${timeBlack < 30000 ? "urgent" : ""}`}>
            {formatTime(timeBlack)}
          </span>
          {winner === "white" && (
            <span className="flag-label">WAKTU HABIS</span>
          )}
        </div>

        <div className="card-footer">
          <span className="status-indicator">
            {activePlayer === "black" && !isPaused
              ? "GILIRAN BERJALAN"
              : "MENUNGGU"}
          </span>
          {increment > 0 && <span className="inc-pill">+{increment}s</span>}
        </div>
      </section>

      {/* DOCK KONTROL TENGAH */}
      <div className="ticks"></div>
      <nav className="center-dock">
        <button
          className="dock-btn"
          onClick={() => setIsFaceToFace(!isFaceToFace)}
          title="Mode Hadap Lawan (180°)"
        >
          <svg
            className="dock-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span className="dock-label">
            {isFaceToFace ? "Tatap Muka" : "Searah"}
          </span>
        </button>

        <button
          className="dock-btn"
          onClick={() => setSoundEnabled(!soundEnabled)}
          title="Suara Jam"
        >
          <svg
            className="dock-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            {soundEnabled ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
              />
            )}
          </svg>
          <span className="dock-label">
            {soundEnabled ? "Suara ON" : "Mute"}
          </span>
        </button>

        {/* Tombol Utama Play / Pause */}
        <button
          className={`play-pulse-btn ${!isPaused ? "running" : ""}`}
          onClick={togglePause}
          title="Space to Start/Pause"
        >
          {isPaused ? (
            <svg
              className="btn-action-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : (
            <svg
              className="btn-action-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          )}
        </button>

        <button
          className="dock-btn"
          onClick={() => resetGame()}
          title="Reset Jam (R)"
        >
          <svg
            className="dock-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          <span className="dock-label">Reset</span>
        </button>

        <button
          className="dock-btn"
          onClick={() => {
            setIsPaused(true);
            setShowSettings(true);
          }}
          title="Pilih Format Waktu"
        >
          <svg
            className="dock-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="dock-label">Waktu</span>
        </button>
      </nav>
      <div className="ticks"></div>

      {/* AREA PEMAIN PUTIH (SISI BAWAH) */}
      <section
        className={`clock-card white-card ${activePlayer === "white" && !isPaused ? "active" : ""} ${
          winner === "black" ? "flagged" : ""
        }`}
        onClick={() => handlePlayerTap("white")}
      >
        <div className="card-topbar">
          <span className="player-badge">
            <span className="dot dot-white"></span> Putih
          </span>
          <span className="move-counter">Langkah: {movesWhite}</span>
        </div>

        <div className="display-wrapper">
          <span className={`time-text ${timeWhite < 30000 ? "urgent" : ""}`}>
            {formatTime(timeWhite)}
          </span>
          {winner === "black" && (
            <span className="flag-label">WAKTU HABIS</span>
          )}
        </div>

        <div className="card-footer">
          <span className="status-indicator">
            {activePlayer === "white" && !isPaused
              ? "GILIRAN BERJALAN"
              : "MENUNGGU"}
          </span>
          {increment > 0 && <span className="inc-pill">+{increment}s</span>}
        </div>
      </section>

      {/* MODAL PENGATURAN PRESET TURNAMEN */}
      {showSettings && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Kontrol Waktu Turnamen</h3>
              <button
                className="close-btn"
                onClick={() => setShowSettings(false)}
              >
                ×
              </button>
            </div>

            <div className="preset-grid">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  className={`preset-item ${baseTime === preset.time && increment === preset.inc ? "selected" : ""}`}
                  onClick={() => {
                    resetGame(preset.time, preset.inc);
                    setShowSettings(false);
                  }}
                >
                  <span className="preset-tag">{preset.tag}</span>
                  <span className="preset-name">{preset.name}</span>
                </button>
              ))}
            </div>

            <form className="custom-time-form" onSubmit={applyCustomTime}>
              <h4>Kustom Waktu</h4>
              <div className="input-row">
                <label>
                  <span>Menit</span>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={customMin}
                    onChange={(e) => setCustomMin(e.target.value)}
                  />
                </label>
                <label>
                  <span>Detik</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={customSec}
                    onChange={(e) => setCustomSec(e.target.value)}
                  />
                </label>
                <label>
                  <span>Incr (dtk)</span>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={customInc}
                    onChange={(e) => setCustomInc(e.target.value)}
                  />
                </label>
              </div>
              <button type="submit" className="btn-apply">
                Terapkan Format
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
