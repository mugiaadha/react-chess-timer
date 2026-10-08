import { useState } from "react";
import "./App.css";

function Counter() {
  let [counter, setCounter] = useState(0);

  function handleClick() {
    setCounter(counter + 1);
  }
  return <button onClick={handleClick}>Click ({counter})</button>;
}

export default Counter;
