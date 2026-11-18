
import type { Todo } from "./types";
import TodoItem from "./TodoItem";

type Props = {
  todos: Todo[];
  updateIsDone: (id: string, value: boolean) => void;
  remove: (id: string) => void;
};

const TodoList = (props: Props) => {
  if (props.todos.length === 0) {
    return (
      <p className="rounded-2xl bg-white p-6 text-center text-purple-400">
        健康習慣がまだ登録されていません。
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {props.todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          updateIsDone={props.updateIsDone}
          remove={props.remove}
        />
      ))}
    </div>
  );
};

export default TodoList;
