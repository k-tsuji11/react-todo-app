
export type HabitCategory =
  | "運動"
  | "食事"
  | "生活習慣"
  | "その他";

export type Todo = {
  id: string;
  name: string;
  isDone: boolean;
  priority: number;
  deadline: Date | null;
  category: HabitCategory;
  completedAt: string | null;
};

export type DailyRecord = {
  date: string;
  water: number;
  sleep: number;
  mood: string;
  exercise: number;
  mealNote: string;
};
