import "./App.css";
import Task from "./Task";

function TodoList() {
  let data = [
    { id: 1, text: "belajar ini", isCompleted: true },
    { id: 2, text: "belajar itu", isCompleted: true },
    { id: 3, text: "belajar js", isCompleted: true },
    { id: 4, text: "belajar react", isCompleted: false },
  ];
  return (
    <ul>
      {data.map((todo) => (
        <Task key={todo.id} {...todo} />
      ))}
    </ul>
  );
}

export default TodoList;
