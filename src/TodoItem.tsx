
import type { Todo } from "./types";

type Props = {
  todo: Todo;
  updateIsDone: (id: string, value: boolean) => void;
  remove: (id: string) => void;
};

const TodoItem = (props: Props) => {
  const { todo } = props;

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-purple-100 bg-white p-4 shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <input
          type="checkbox"
          checked={todo.isDone}
          onChange={(e) =>
            props.updateIsDone(todo.id, e.target.checked)
          }
          className="h-5 w-5 accent-purple-500"
        />

        <div className="min-w-0">
          <p className={`font-medium text-purple-900 ${
            todo.isDone ? "line-through opacity-50" : ""
          }`}>
            {todo.name}
          </p>

          <span className="text-xs text-purple-400">
            {todo.category}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => props.remove(todo.id)}
        className="shrink-0 rounded-xl bg-purple-50 px-3 py-2 text-sm text-purple-600 hover:bg-purple-100"
      >
        削除
      </button>
    </div>
  );
};

export default TodoItem;
