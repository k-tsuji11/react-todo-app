
import type { Todo } from "./types";

export const initTodos: Todo[] = [
  {
    id: "habit-1",
    name: "水分補給をする",
    isDone: false,
    priority: 3,
    deadline: null,
    category: "生活習慣",
    completedAt: null,
  },
  {
    id: "habit-2",
    name: "軽いストレッチをする",
    isDone: false,
    priority: 2,
    deadline: null,
    category: "運動",
    completedAt: null,
  },
  {
    id: "habit-3",
    name: "朝食を記録する",
    isDone: false,
    priority: 2,
    deadline: null,
    category: "食事",
    completedAt: null,
  },
  {
    id: "habit-4",
    name: "ゆっくり休む時間を作る",
    isDone: false,
    priority: 1,
    deadline: null,
    category: "生活習慣",
    completedAt: null,
  },
];
