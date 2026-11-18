
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { v4 as uuid } from "uuid";
import type { Todo, DailyRecord, HabitCategory } from "./types";
import { initTodos } from "./initTodos";

const HABITS_KEY = "WellnessNoteHabits";
const RECORDS_KEY = "WellnessNoteRecords";

const dateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const today = dateKey(new Date());

const emptyRecord = (date: string): DailyRecord => ({
  date,
  water: 0,
  sleep: 0,
  mood: "",
  exercise: 0,
  mealNote: "",
});

const loadHabits = (): Todo[] => {
  const saved = localStorage.getItem(HABITS_KEY);
  if (!saved) return initTodos;

  try {
    return JSON.parse(saved).map((habit: Todo) => ({
      ...habit,
      deadline: habit.deadline ? new Date(habit.deadline) : null,
      category: habit.category || "その他",
      completedAt: habit.completedAt || null,
    }));
  } catch {
    return initTodos;
  }
};

const loadRecords = (): Record<string, DailyRecord> => {
  try {
    return JSON.parse(localStorage.getItem(RECORDS_KEY) || "{}");
  } catch {
    return {};
  }
};

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #f3e3ed",
  borderRadius: "22px",
  padding: "22px",
  boxShadow: "0 5px 18px rgba(190, 145, 175, 0.08)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #ead9e8",
  borderRadius: "12px",
  padding: "12px",
  fontSize: "15px",
  background: "#fffafd",
  color: "#55475a",
  outlineColor: "#d9a9ca",
};

const buttonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: "12px",
  padding: "10px 16px",
  background: "#f3e2ef",
  color: "#805b79",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "15px",
};

const App = () => {
  const [habits, setHabits] = useState<Todo[]>(loadHabits);
  const [records, setRecords] = useState<Record<string, DailyRecord>>(loadRecords);
  const [habitName, setHabitName] = useState("");
  const [category, setCategory] = useState<HabitCategory>("生活習慣");

  const record = records[today] || emptyRecord(today);

  const updateRecord = (values: Partial<DailyRecord>) => {
    setRecords((current) => ({
      ...current,
      [today]: {
        ...(current[today] || emptyRecord(today)),
        ...values,
      },
    }));
  };

  useEffect(() => {
    localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  }, [records]);

  const toggleHabit = (id: string) => {
    setHabits((current) =>
      current.map((habit) =>
        habit.id === id ? { ...habit, isDone: !habit.isDone } : habit,
      ),
    );
  };

  const addHabit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = habitName.trim();

    if (name.length < 2 || name.length > 32) return;

    const newHabit: Todo = {
      id: uuid(),
      name,
      isDone: false,
      priority: 2,
      deadline: null,
      category,
      completedAt: null,
    };

    setHabits((current) => [...current, newHabit]);
    setHabitName("");
  };

  const deleteHabit = (id: string) => {
    setHabits((current) => current.filter((habit) => habit.id !== id));
  };

  const completedCount = habits.filter((habit) => habit.isDone).length;
  const progress =
    habits.length === 0 ? 0 : Math.round((completedCount / habits.length) * 100);

  const weekData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = dateKey(date);
    return {
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      water: records[key]?.water || 0,
    };
  });

  const maxWater = Math.max(5, ...weekData.map((day) => day.water));

  const moodOptions = [
    { value: "元気", emoji: "😊" },
    { value: "普通", emoji: "😐" },
    { value: "疲れた", emoji: "😴" },
  ];

  const categories: HabitCategory[] = [
    "運動",
    "食事",
    "生活習慣",
    "その他",
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #fff7fb 0%, #f7f2ff 100%)",
        color: "#55475a",
        padding: "35px 18px 60px",
        fontFamily: '"Noto Sans JP", sans-serif',
      }}
    >
      <main style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {/* ヘッダー */}
        <header style={{ textAlign: "center", marginBottom: "32px" }}>
          <p
            style={{
              color: "#b18aa9",
              letterSpacing: "3px",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            YOUR DAILY WELLNESS JOURNAL
          </p>

          <h1
            style={{
              fontSize: "clamp(32px, 6vw, 48px)",
              color: "#59465d",
              margin: "8px 0",
              fontWeight: 800,
            }}
          >
            Wellness Note <span style={{ color: "#d99cbd" }}>♡</span>
          </h1>

          <p style={{ color: "#987b9c", fontSize: "16px" }}>
            {new Date().toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "short",
            })}
          </p>
          <p style={{ margin: "12px 0 4px", fontSize: "18px", fontWeight: 700 }}>
            今日も自分を大切に。
          </p>
          <p style={{ color: "#9c879d", margin: 0 }}>
            小さな習慣を記録して、毎日の変化を楽しもう。
          </p>
        </header>

        {/* 達成率 */}
        <section
          style={{
            ...cardStyle,
            background: "linear-gradient(110deg, #fce8f2, #eee8ff)",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div>
              <p style={{ margin: 0, color: "#947594", fontSize: "14px" }}>
                TODAY'S HABIT
              </p>
              <h2 style={{ margin: "5px 0", fontSize: "21px" }}>
                今日の習慣達成率
              </h2>
              <p style={{ margin: 0, color: "#8d7891" }}>
                {completedCount} / {habits.length} 個の習慣を達成
              </p>
            </div>
            <strong style={{ fontSize: "36px", color: "#a66f9b" }}>
              {progress}%
            </strong>
          </div>

          <div
            style={{
              height: "12px",
              background: "#ffffffb8",
              borderRadius: "20px",
              marginTop: "16px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "linear-gradient(90deg, #e8a9c9, #bba8e8)",
                borderRadius: "20px",
                transition: "width 0.3s",
              }}
            />
          </div>
        </section>

        {/* 今日の記録 */}
        <section style={{ marginBottom: "30px" }}>
          <div style={{ marginBottom: "15px" }}>
            <p
              style={{
                color: "#b18aa9",
                letterSpacing: "2px",
                fontSize: "12px",
                margin: 0,
              }}
            >
              DAILY RECORD
            </p>
            <h2 style={{ fontSize: "23px", margin: "4px 0" }}>
              今日の記録 <span style={{ color: "#d99cbd" }}>✿</span>
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
              gap: "16px",
            }}
          >
            {/* 水分補給 */}
            <section style={cardStyle}>
              <h3 style={{ margin: "0 0 18px", fontSize: "18px" }}>
                💧 水分補給
              </h3>
              <p style={{ color: "#9b849c", fontSize: "13px", margin: "0 0 8px" }}>
                今日飲んだコップの数
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <strong style={{ fontSize: "30px", color: "#8d83c5" }}>
                  {record.water}
                  <span style={{ fontSize: "15px", marginLeft: "5px" }}>杯</span>
                </strong>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    style={buttonStyle}
                    onClick={() => updateRecord({ water: Math.max(0, record.water - 1) })}
                  >
                    −
                  </button>
                  <button
                    style={{ ...buttonStyle, background: "#e9e3fa" }}
                    onClick={() => updateRecord({ water: record.water + 1 })}
                  >
                    ＋
                  </button>
                </div>
              </div>
            </section>

            {/* 睡眠 */}
            <section style={cardStyle}>
              <h3 style={{ margin: "0 0 18px", fontSize: "18px" }}>
                🌙 睡眠
              </h3>
              <label style={{ display: "block", fontSize: "13px", color: "#9b849c", marginBottom: "8px" }}>
                睡眠時間（時間）
              </label>
              <input
                style={inputStyle}
                type="number"
                min="0"
                max="24"
                step="0.5"
                placeholder="例：7.5"
                value={record.sleep || ""}
                onChange={(e) => updateRecord({ sleep: Number(e.target.value) })}
              />
            </section>

            {/* 気分 */}
            <section style={cardStyle}>
              <h3 style={{ margin: "0 0 18px", fontSize: "18px" }}>
                🌷 今日の気分
              </h3>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {moodOptions.map((mood) => (
                  <button
                    key={mood.value}
                    onClick={() => updateRecord({ mood: mood.value })}
                    style={{
                      ...buttonStyle,
                      flex: 1,
                      minWidth: "85px",
                      background: record.mood === mood.value ? "#e8d7f1" : "#fff5fa",
                      border: record.mood === mood.value ? "2px solid #c49ac8" : "2px solid transparent",
                    }}
                  >
                    {mood.emoji} {mood.value}
                  </button>
                ))}
              </div>
            </section>

            {/* 運動 */}
            <section style={cardStyle}>
              <h3 style={{ margin: "0 0 18px", fontSize: "18px" }}>
                🏃 運動
              </h3>
              <label style={{ display: "block", fontSize: "13px", color: "#9b849c", marginBottom: "8px" }}>
                運動した時間（分）
              </label>
              <input
                style={inputStyle}
                type="number"
                min="0"
                placeholder="例：30"
                value={record.exercise || ""}
                onChange={(e) => updateRecord({ exercise: Number(e.target.value) })}
              />
            </section>
          </div>
        </section>

        {/* 食事メモ */}
        <section style={{ ...cardStyle, marginBottom: "30px" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "18px" }}>
            🍰 食事のメモ
          </h3>
          <p style={{ color: "#9b849c", fontSize: "13px", margin: "0 0 10px" }}>
            今日食べたものや、気づいたことを書いてみよう。
          </p>
          <textarea
            style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
            placeholder="今日のごはんや感想を自由に記録..."
            value={record.mealNote}
            onChange={(e) => updateRecord({ mealNote: e.target.value })}
          />
        </section>

        {/* 習慣リスト */}
        <section style={{ marginBottom: "30px" }}>
          <div style={{ marginBottom: "15px" }}>
            <p style={{ color: "#b18aa9", letterSpacing: "2px", fontSize: "12px", margin: 0 }}>
              MY LITTLE HABITS
            </p>
            <h2 style={{ fontSize: "23px", margin: "4px 0" }}>
              毎日の習慣 <span style={{ color: "#d99cbd" }}>♡</span>
            </h2>
          </div>

          <section style={cardStyle}>
            <form
              onSubmit={addHabit}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) minmax(120px, 150px) auto",
                gap: "10px",
                marginBottom: "20px",
              }}
            >
              <input
                style={inputStyle}
                value={habitName}
                onChange={(e) => setHabitName(e.target.value)}
                placeholder="新しい習慣を入力..."
                minLength={2}
                maxLength={32}
              />
              <select
                style={inputStyle}
                value={category}
                onChange={(e) => setCategory(e.target.value as HabitCategory)}
              >
                {categories.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <button
                type="submit"
                style={{ ...buttonStyle, background: "#d9c5eb", color: "#624d70" }}
              >
                ＋ 追加
              </button>
            </form>

            <div style={{ display: "grid", gap: "10px" }}>
              {habits.length === 0 && (
                <p style={{ textAlign: "center", color: "#a58da5" }}>
                  まだ習慣がありません。新しい習慣を追加してみよう！
                </p>
              )}

              {habits.map((habit) => (
                <div
                  key={habit.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "13px",
                    borderRadius: "14px",
                    background: habit.isDone ? "#f7f0fa" : "#fff9fc",
                    border: "1px solid #f1e5ef",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={habit.isDone}
                    onChange={() => toggleHabit(habit.id)}
                    style={{ width: "19px", height: "19px", accentColor: "#c18db5" }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        textDecoration: habit.isDone ? "line-through" : "none",
                        color: habit.isDone ? "#ad9eaf" : "#594b5d",
                      }}
                    >
                      {habit.name}
                    </div>
                    <span style={{ fontSize: "12px", color: "#a68ca5" }}>
                      {habit.category || "その他"}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    style={{ ...buttonStyle, padding: "7px 10px", background: "#fff0f3", color: "#b47d91" }}
                    aria-label={`${habit.name}を削除`}
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          </section>
        </section>

        {/* 7日間の水分グラフ */}
        <section style={{ marginBottom: "30px" }}>
          <div style={{ marginBottom: "15px" }}>
            <p style={{ color: "#b18aa9", letterSpacing: "2px", fontSize: "12px", margin: 0 }}>
              WEEKLY TRACKER
            </p>
            <h2 style={{ fontSize: "23px", margin: "4px 0" }}>
              7日間の水分記録 💧
            </h2>
          </div>

          <section style={cardStyle}>
            <p style={{ color: "#9b849c", fontSize: "13px", marginTop: 0 }}>
              1日に飲んだコップの数
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                gap: "10px",
                alignItems: "end",
                height: "180px",
                paddingTop: "10px",
              }}
            >
              {weekData.map((day) => (
                <div
                  key={day.label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "end",
                    height: "100%",
                    gap: "7px",
                    minWidth: 0,
                  }}
                >
                  <span style={{ fontSize: "12px", color: "#9b849c" }}>
                    {day.water}
                  </span>
                  <div
                    style={{
                      width: "min(100%, 38px)",
                      height: `${Math.max(5, (day.water / maxWater) * 105)}px`,
                      background: "linear-gradient(180deg, #c7b7ed, #e8b7d3)",
                      borderRadius: "10px 10px 4px 4px",
                    }}
                  />
                  <span style={{ fontSize: "11px", color: "#9b849c" }}>
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </section>

        <footer style={{ textAlign: "center", color: "#b49bb3", fontSize: "13px", padding: "15px" }}>
          Made with ♡ Wellness Note
          <p style={{ margin: "5px 0" }}>自分のペースで、少しずつ。</p>
        </footer>
      </main>
    </div>
  );
};

export default App;
