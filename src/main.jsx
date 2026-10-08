import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import HelloWorld from "./HelloWorld.jsx";
import TodoList from "./TodoList.jsx";
import Container from "./Container.jsx";
import Counter from "./Counter.jsx";
import ChessTimer from "./ChessTimer/ChessTimer.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* <Container>
      <App />
      <HelloWorld />
      <TodoList />
      <Counter />
    </Container> */}

    <ChessTimer />
  </StrictMode>,
);
