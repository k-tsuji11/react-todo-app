
import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import type { Todo, DailyRecord, HabitCategory } from "./types";
import { initTodos } from "./initTodos";
import TodoList from "./TodoList";

const habitKey = "WellnessNoteHabits";
const recordKey = "WellnessNoteRecords";

const today = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const createRecord = (date: string): DailyRecord => ({
  date,
  water: 0,
  sleep: 0,
  mood: "",
  exercise: 0,
  mealNote: "",
});

const loadHabits = (): Todo[] => {
  try {
    const saved = localStorage.getItem(habitKey);
    if (!saved) return initTodos;

    return JSON.parse(saved).map((item: Todo) => ({
      ...item,
      category: item.category || "その他",
      completedAt: item.completedAt || null,
      deadline: item.deadline ? new Date(item.deadline) : null,
    }));
  } catch {
    return initTodos;
  }
};

const loadRecords = (): Record<string, DailyRecord> => {
  try {
    return JSON.parse(localStorage.getItem(recordKey) || "{}");
  } catch {
    return {};
  }
};

const App = () => {
  const [todos, setTodos] = useState<Todo[]>(loadHabits);
  const [records, setRecords] = useState<Record<string, DailyRecord>>(loadRecords);

  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<HabitCategory>("生活習慣");

  const date = today();
  const current = records[date] || createRecord(date);

  const completed = todos.filter((todo) => todo.isDone).length;
  const progress = todos.length
    ? Math.round((completed / todos.length) * 100)
    : 0;

  useEffect(() => {
    localStorage.setItem(habitKey, JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem(recordKey, JSON.stringify(records));
  }, [records]);

  const updateRecord = (changes: Partial<DailyRecord>) => {
    setRecords((old) => ({
      ...old,
      [date]: {
        ...(old[date] || createRecord(date)),
        ...changes,
      },
    }));
  };

  const addHabit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const name = newName.trim();
    if (name.length < 2 || name.length > 32) return;

    const newTodo: Todo = {
      id: uuid(),
      name,
      isDone: false,
      priority: 2,
      deadline: null,
      category: newCategory,
      completedAt: null,
    };

    setTodos((old) => [...old, newTodo]);
    setNewName("");
  };

  const updateIsDone = (id: string, value: boolean) => {
    setTodos((old) =>
      old.map((todo) =>
        todo.id === id
          ? {
              ...todo,
              isDone: value,
              completedAt: value ? date : null,
            }
          : todo
      )
    );
  };

  const remove = (id: string) => {
    setTodos((old) => old.filter((todo) => todo.id !== id));
  };

  const lastSevenDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
    };
  });

  return (
    <main className="min-h-screen bg-[#F8F5FC] px-4 py-8 text-slate-700">
      <div className="mx-auto max-w-3xl space-y-6">

        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium tracking-widest text-purple-400">
              MY DAILY WELLNESS
            </p>
            <h1 className="text-3xl font-bold text-purple-900">
              Wellness Note ♡
            </h1>
            <p className="mt-1 text-sm text-purple-400">
              小さな習慣から、毎日を心地よく。
            </p>
          </div>
          <div className="rounded-2xl bg-purple-100 p-4 text-3xl">
            ♡
          </div>
        </header>

        <section className="rounded-3xl bg-gradient-to-r from-purple-300 to-purple-400 p-6 text-white shadow-sm">
          <p className="text-sm opacity-90">TODAY'S MESSAGE</p>
          <h2 className="mt-2 text-2xl font-bold">
            今日も自分のペースで。
          </h2>
          <p className="mt-2 text-sm opacity-90">
            無理せず、できることから始めよう。
          </p>
          <p className="mt-4 text-sm">
            {date.replaceAll("-", "/")}
          </p>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "水分補給", value: `${current.water} 杯`, icon: "💧" },
            { label: "睡眠時間", value: `${current.sleep} 時間`, icon: "🌙" },
            { label: "運動時間", value: `${current.exercise} 分`, icon: "🚶" },
            { label: "今日の気分", value: current.mood || "未記録", icon: "🌷" },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-purple-100 bg-white p-4 shadow-sm">
              <p className="text-2xl">{item.icon}</p>
              <p className="mt-2 text-xs text-purple-400">{item.label}</p>
              <p className="mt-1 font-bold text-purple-900">{item.value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-purple-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-purple-900">
            🌸 今日の健康記録
          </h2>

          <div className="mt-5 space-y-5">
            <div>
              <div className="flex justify-between">
                <label className="font-medium">💧 水分補給</label>
                <span className="text-sm text-purple-500">{current.water} 杯</span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <button type="button" onClick={() => updateRecord({ water: Math.max(0, current.water - 1) })} className="rounded-xl bg-purple-100 px-4 py-2 text-purple-700">−</button>
                <div className="flex-1 rounded-full bg-purple-50 py-2 text-center text-sm text-purple-500">
                  今日の水分量を記録
                </div>
                <button type="button" onClick={() => updateRecord({ water: current.water + 1 })} className="rounded-xl bg-purple-500 px-4 py-2 text-white">＋</button>
              </div>
            </div>

            <div>
              <label htmlFor="sleep" className="font-medium">🌙 睡眠時間</label>
              <div className="mt-2 flex items-center gap-2">
                <input id="sleep" type="number" min="0" max="24" step="0.5" value={current.sleep} onChange={(e) => updateRecord({ sleep: Math.min(24, Math.max(0, Number(e.target.value))) })} className="w-full rounded-xl border border-purple-100 p-3 outline-purple-300" />
                <span>時間</span>
              </div>
            </div>

            <div>
              <p className="font-medium">😊 今日の気分</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {["😊", "🙂", "😐", "😴", "😔"].map((mood) => (
                  <button key={mood} type="button" onClick={() => updateRecord({ mood })} className={`rounded-xl p-3 text-2xl ${current.mood === mood ? "bg-purple-200 ring-2 ring-purple-400" : "bg-purple-50"}`}>
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="exercise" className="font-medium">🚶 運動時間</label>
              <div className="mt-2 flex items-center gap-2">
                <input id="exercise" type="number" min="0" value={current.exercise} onChange={(e) => updateRecord({ exercise: Math.max(0, Number(e.target.value)) })} className="w-full rounded-xl border border-purple-100 p-3 outline-purple-300" />
                <span>分</span>
              </div>
            </div>

            <div>
              <label htmlFor="meal" className="font-medium">🍽️ 食事メモ</label>
              <textarea id="meal" value={current.mealNote} onChange={(e) => updateRecord({ mealNote: e.target.value })} placeholder="今日食べたものや気づいたこと..." className="mt-2 w-full rounded-xl border border-purple-100 p-3 outline-purple-300" rows={3} />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-purple-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-purple-900">♡ 健康習慣リスト</h2>

          <div className="mt-4">
            <div className="flex justify-between text-sm">
              <span>今日の達成率</span>
              <span className="font-bold text-purple-600">{progress}%</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-purple-100">
              <div className="h-full rounded-full bg-purple-400 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-xs text-purple-400">{completed} / {todos.length} 件完了</p>
          </div>

          <form onSubmit={addHabit} className="mt-5 space-y-3">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} minLength={2} maxLength={32} required placeholder="新しい健康習慣を入力..." className="w-full rounded-xl border border-purple-100 p-3 outline-purple-300" />
            <div className="flex flex-wrap gap-2">
              <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as HabitCategory)} className="flex-1 rounded-xl border border-purple-100 p-3">
                <option value="生活習慣">生活習慣</option>
                <option value="運動">運動</option>
                <option value="食事">食事</option>
                <option value="その他">その他</option>
              </select>
              <button type="submit" className="rounded-xl bg-purple-500 px-5 py-3 font-bold text-white hover:bg-purple-600">
                ＋ 追加
              </button>
            </div>
          </form>

          <div className="mt-5">
            <TodoList todos={todos} updateIsDone={updateIsDone} remove={remove} />
          </div>
        </section>

        <section className="rounded-3xl border border-purple-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-purple-900">📊 1週間の記録</h2>
          <p className="mt-1 text-xs text-purple-400">毎日の水分補給の記録</p>
          <div className="mt-5 flex h-40 items-end justify-around gap-2">
            {lastSevenDays.map((day) => {
              const amount = records[day.date]?.water || 0;
              const height = Math.min(100, amount * 12);
              return (
                <div key={day.date} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <span className="text-xs text-purple-500">{amount}</span>
                  <div className="flex h-28 w-full items-end justify-center">
                    <div className="w-full max-w-8 rounded-t-xl bg-purple-300" style={{ height: `${height}%` }} />
                  </div>
                  <span className="text-xs text-purple-400">{day.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        <footer className="pb-4 text-center text-xs text-purple-400">
          Wellness Note ♡ Take care of yourself.
        </footer>

      </div>
    </main>
  );
};

export default App;
