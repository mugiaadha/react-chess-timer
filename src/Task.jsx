import "./App.css";

function Task({ text, isCompleted, isDeleted = false }) {
  if (isDeleted) {
    return null;
  } else {
    return (
      <li>
        {text} {isCompleted && "✅"}
      </li>
    );
  }
}

export default Task;
