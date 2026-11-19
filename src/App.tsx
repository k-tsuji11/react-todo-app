
import { useEffect, useMemo, useState } from "react";
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
  try {
    const saved = localStorage.getItem(HABITS_KEY);
    if (!saved) return initTodos;

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
  border: "1px solid #f0e2ee",
  borderRadius: "22px",
  padding: "22px",
  boxShadow: "0 5px 18px rgba(190,145,175,0.08)",
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
};

const buttonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: "12px",
  padding: "10px 16px",
  background: "#f3e2ef",
  color: "#805b79",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "14px",
};

const sectionTitle: React.CSSProperties = {
  fontSize: "23px",
  margin: "5px 0 16px",
  color: "#59465d",
};

const formatDate = (date: string) =>
  new Date(date + "T00:00:00").toLocaleDateString("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

const App = () => {
  const [habits, setHabits] = useState<Todo[]>(loadHabits);
  const [records, setRecords] = useState<Record<string, DailyRecord>>(loadRecords);

  const [habitName, setHabitName] = useState("");
  const [category, setCategory] = useState<HabitCategory>("生活習慣");

  const [selectedDate, setSelectedDate] = useState(today);
  const [monthCursor, setMonthCursor] = useState(new Date());

  const record = records[selectedDate] || emptyRecord(selectedDate);

  useEffect(() => {
    localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  }, [records]);

  const updateRecord = (values: Partial<DailyRecord>) => {
    setRecords((current) => ({
      ...current,
      [selectedDate]: {
        ...(current[selectedDate] || emptyRecord(selectedDate)),
        ...values,
      },
    }));
  };

  // 習慣管理
  const toggleHabit = (id: string) => {
    setHabits((current) =>
      current.map((habit) =>
        habit.id === id ? { ...habit, isDone: !habit.isDone } : habit
      )
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
    habits.length === 0
      ? 0
      : Math.round((completedCount / habits.length) * 100);

  // 月間レポート
  const monthKey = `${monthCursor.getFullYear()}-${String(
    monthCursor.getMonth() + 1
  ).padStart(2, "0")}`;

  const monthEntries = useMemo(
    () =>
      Object.entries(records)
        .filter(([key]) => key.startsWith(monthKey))
        .sort(([a], [b]) => b.localeCompare(a)),
    [records, monthKey]
  );

  const monthValues = monthEntries.map(([, value]) => value);

  const average = (values: number[]) =>
    values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : 0;

  const averageWater = average(monthValues.map((r) => r.water));
  const averageSleep = average(monthValues.map((r) => r.sleep));
  const totalExercise = monthValues.reduce(
    (sum, r) => sum + r.exercise,
    0
  );

  const moodCounts = {
    元気: monthValues.filter((r) => r.mood === "元気").length,
    普通: monthValues.filter((r) => r.mood === "普通").length,
    疲れた: monthValues.filter((r) => r.mood === "疲れた").length,
  };

  const moodTotal = Object.values(moodCounts).reduce(
    (sum, value) => sum + value,
    0
  );

  // 直近7日間の記録
  const weekData = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(selectedDate + "T00:00:00");
      date.setDate(date.getDate() - (6 - index));

      const key = dateKey(date);
      const data = records[key];

      return {
        key,
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        water: data?.water || 0,
        sleep: data?.sleep || 0,
        exercise: data?.exercise || 0,
      };
    });
  }, [records, selectedDate]);

  const maxWater = Math.max(5, ...weekData.map((d) => d.water));
  const maxSleep = Math.max(8, ...weekData.map((d) => d.sleep));
  const maxExercise = Math.max(60, ...weekData.map((d) => d.exercise));

  const categories: HabitCategory[] = [
    "運動",
    "食事",
    "生活習慣",
    "その他",
  ];

  const moods = [
    { value: "元気", emoji: "😊" },
    { value: "普通", emoji: "😐" },
    { value: "疲れた", emoji: "😴" },
  ];

  // 共通グラフ
  const renderChart = (
    title: string,
    icon: string,
    data: { label: string; value: number }[],
    max: number,
    unit: string,
    color: string
  ) => (
    <section style={cardStyle}>
      <h3 style={{ marginTop: 0, fontSize: "17px" }}>
        {icon} {title}
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          gap: "8px",
          alignItems: "end",
          height: "145px",
          paddingTop: "10px",
        }}
      >
        {data.map((day, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "end",
              height: "100%",
              gap: "6px",
              minWidth: 0,
            }}
          >
            <span style={{ fontSize: "11px", color: "#987b9c" }}>
              {day.value}
            </span>

            <div
              style={{
                width: "min(100%, 35px)",
                height: `${Math.max(
                  day.value > 0 ? 5 : 2,
                  (day.value / max) * 90
                )}px`,
                background: color,
                borderRadius: "9px 9px 4px 4px",
                transition: "height 0.3s",
              }}
            />

            <span style={{ fontSize: "10px", color: "#987b9c" }}>
              {day.label}
            </span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: "12px", color: "#aa94aa", marginBottom: 0 }}>
        単位：{unit}
      </p>
    </section>
  );

  const changeMonth = (amount: number) => {
    setMonthCursor(
      new Date(
        monthCursor.getFullYear(),
        monthCursor.getMonth() + amount,
        1
      )
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#fff7fb 0%,#f7f2ff 100%)",
        color: "#55475a",
        padding: "30px 16px 60px",
        fontFamily: '"Noto Sans JP",sans-serif',
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        button, input, select, textarea { font-family: inherit; }
        button { transition: opacity .2s, transform .2s; }
        button:hover { opacity: .8; }
        .wellness-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit,minmax(min(100%,280px),1fr));
          gap: 16px;
        }
        .wellness-form {
          display: grid;
          grid-template-columns: minmax(0,1fr) 140px auto;
          gap: 10px;
        }
        @media(max-width: 540px) {
          .wellness-form { grid-template-columns: 1fr; }
        }
      `}</style>

      <main style={{ maxWidth: "1050px", margin: "0 auto" }}>
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
              fontSize: "clamp(32px,6vw,48px)",
              color: "#59465d",
              margin: "8px 0",
              fontWeight: 800,
            }}
          >
            Wellness Note <span style={{ color: "#d99cbd" }}>♡</span>
          </h1>

          <p style={{ color: "#987b9c" }}>
            {new Date().toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "short",
            })}
          </p>

          <p style={{ fontSize: "18px", fontWeight: 700 }}>
            今日も自分を大切に。
          </p>
          <p style={{ color: "#9c879d" }}>
            小さな習慣を記録して、毎日の変化を楽しもう。
          </p>
        </header>

        {/* 習慣達成率 */}
        <section
          style={{
            ...cardStyle,
            background: "linear-gradient(110deg,#fce8f2,#eee8ff)",
            marginBottom: "30px",
          }}
        >
          <p style={{ color: "#947594", fontSize: "13px" }}>
            TODAY'S HABIT
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div>
              <h2 style={{ margin: "5px 0" }}>今日の習慣達成率</h2>
              <p style={{ margin: 0, color: "#8d7891" }}>
                {completedCount} / {habits.length} 個達成
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
                background: "linear-gradient(90deg,#e8a9c9,#bba8e8)",
                borderRadius: "20px",
              }}
            />
          </div>
        </section>

        {/* 今日の記録 */}
        <section style={{ marginBottom: "32px" }}>
          <p style={{ color: "#b18aa9", letterSpacing: "2px", fontSize: "12px" }}>
            DAILY RECORD
          </p>
          <h2 style={sectionTitle}>
            今日の記録 <span style={{ color: "#d99cbd" }}>✿</span>
          </h2>

          <div
            style={{
              ...cardStyle,
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <label style={{ fontWeight: 600 }}>
              📅 記録する日付
            </label>
            <input
              type="date"
              value={selectedDate}
              max={today}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ ...inputStyle, width: "auto" }}
            />
            <button
              style={buttonStyle}
              onClick={() => setSelectedDate(today)}
            >
              今日に戻る
            </button>
          </div>

          {selectedDate !== today && (
            <p style={{ color: "#a27b9c", fontSize: "13px" }}>
              過去の日付を表示中です。入力した内容はその日の記録として保存されます。
            </p>
          )}

          <div className="wellness-grid">
            {/* 水分 */}
            <section style={cardStyle}>
              <h3>💧 水分補給</h3>
              <p style={{ color: "#9b849c", fontSize: "13px" }}>
                今日飲んだコップの数
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <strong style={{ fontSize: "32px", color: "#8d83c5" }}>
                  {record.water} 杯
                </strong>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    style={buttonStyle}
                    onClick={() =>
                      updateRecord({
                        water: Math.max(0, record.water - 1),
                      })
                    }
                  >
                    −
                  </button>
                  <button
                    style={{ ...buttonStyle, background: "#e9e3fa" }}
                    onClick={() =>
                      updateRecord({ water: record.water + 1 })
                    }
                  >
                    ＋
                  </button>
                </div>
              </div>
            </section>

            {/* 睡眠 */}
            <section style={cardStyle}>
              <h3>🌙 睡眠</h3>
              <p style={{ color: "#9b849c", fontSize: "13px" }}>
                睡眠時間（時間）
              </p>
              <input
                style={inputStyle}
                type="number"
                min="0"
                max="24"
                step="0.5"
                placeholder="例：7.5"
                value={record.sleep || ""}
                onChange={(e) =>
                  updateRecord({
                    sleep: Math.min(24, Math.max(0, Number(e.target.value))),
                  })
                }
              />
            </section>

            {/* 気分 */}
            <section style={cardStyle}>
              <h3>🌷 今日の気分</h3>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {moods.map((mood) => (
                  <button
                    key={mood.value}
                    onClick={() => updateRecord({ mood: mood.value })}
                    style={{
                      ...buttonStyle,
                      flex: 1,
                      background:
                        record.mood === mood.value ? "#e8d7f1" : "#fff5fa",
                      border:
                        record.mood === mood.value
                          ? "2px solid #c49ac8"
                          : "2px solid transparent",
                    }}
                  >
                    {mood.emoji} {mood.value}
                  </button>
                ))}
              </div>
            </section>

            {/* 運動 */}
            <section style={cardStyle}>
              <h3>🏃 運動</h3>
              <p style={{ color: "#9b849c", fontSize: "13px" }}>
                運動した時間（分）
              </p>
              <input
                style={inputStyle}
                type="number"
                min="0"
                placeholder="例：30"
                value={record.exercise || ""}
                onChange={(e) =>
                  updateRecord({
                    exercise: Math.max(0, Number(e.target.value)),
                  })
                }
              />
            </section>
          </div>
        </section>

        {/* 食事メモ */}
        <section style={{ ...cardStyle, marginBottom: "32px" }}>
          <h3>🍰 食事のメモ</h3>
          <p style={{ color: "#9b849c", fontSize: "13px" }}>
            食べたものや気づいたことを書いてみよう。
          </p>
          <textarea
            style={{
              ...inputStyle,
              minHeight: "110px",
              resize: "vertical",
            }}
            placeholder="今日のごはんや感想を自由に記録..."
            value={record.mealNote}
            onChange={(e) => updateRecord({ mealNote: e.target.value })}
          />
        </section>

        {/* 習慣管理 */}
        <section style={{ marginBottom: "32px" }}>
          <p style={{ color: "#b18aa9", letterSpacing: "2px", fontSize: "12px" }}>
            MY LITTLE HABITS
          </p>
          <h2 style={sectionTitle}>毎日の習慣 ♡</h2>

          <section style={cardStyle}>
            <form onSubmit={addHabit} className="wellness-form">
              <input
                style={inputStyle}
                value={habitName}
                onChange={(e) => setHabitName(e.target.value)}
                placeholder="新しい習慣を入力..."
                minLength={2}
                maxLength={32}
                required
              />

              <select
                style={inputStyle}
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as HabitCategory)
                }
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                style={{
                  ...buttonStyle,
                  background: "#d9c5eb",
                  color: "#624d70",
                }}
              >
                ＋ 追加
              </button>
            </form>

            <div style={{ display: "grid", gap: "10px" }}>
              {habits.length === 0 && (
                <p style={{ textAlign: "center", color: "#a58da5" }}>
                  まだ習慣がありません。
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
                    style={{
                      width: "19px",
                      height: "19px",
                      accentColor: "#c18db5",
                    }}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        textDecoration: habit.isDone
                          ? "line-through"
                          : "none",
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
                    style={{
                      ...buttonStyle,
                      padding: "7px 10px",
                      background: "#fff0f3",
                      color: "#b47d91",
                    }}
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          </section>
        </section>

        {/* 記録まとめ */}
        <section style={{ marginBottom: "32px" }}>
          <p style={{ color: "#b18aa9", letterSpacing: "2px", fontSize: "12px" }}>
            MY RECORD SUMMARY
          </p>
          <h2 style={sectionTitle}>記録まとめ ✨</h2>

          <section
            style={{
              ...cardStyle,
              background: "linear-gradient(110deg,#fce8f2,#eee8ff)",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <h3 style={{ margin: 0 }}>📅 月間レポート</h3>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  style={buttonStyle}
                  onClick={() => changeMonth(-1)}
                >
                  ←
                </button>
                <strong style={{ alignSelf: "center" }}>
                  {monthCursor.getFullYear()}年
                  {monthCursor.getMonth() + 1}月
                </strong>
                <button
                  style={buttonStyle}
                  onClick={() => changeMonth(1)}
                  disabled={monthKey >= today.slice(0, 7)}
                >
                  →
                </button>
              </div>
            </div>
            <p style={{ color: "#987b9c", fontSize: "13px" }}>
              この月に保存された記録を集計しています。
            </p>
          </section>

          <div className="wellness-grid">
            {[
              {
                label: "記録した日数",
                value: `${monthEntries.length} 日`,
                emoji: "🗓️",
                color: "#f5eaf7",
              },
              {
                label: "平均水分量",
                value: `${averageWater.toFixed(1)} 杯`,
                emoji: "💧",
                color: "#eaf3fa",
              },
              {
                label: "平均睡眠時間",
                value: `${averageSleep.toFixed(1)} 時間`,
                emoji: "🌙",
                color: "#eeeaff",
              },
              {
                label: "合計運動時間",
                value: `${totalExercise} 分`,
                emoji: "🏃",
                color: "#fcecf2",
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  ...cardStyle,
                  background: item.color,
                }}
              >
                <p style={{ fontSize: "13px", color: "#987b9c" }}>
                  {item.emoji} {item.label}
                </p>
                <strong style={{ fontSize: "27px", color: "#80658d" }}>
                  {item.value}
                </strong>
              </div>
            ))}
          </div>

          {/* 気分の集計 */}
          <section style={{ ...cardStyle, marginTop: "16px" }}>
            <h3>🌷 今月の気分</h3>
            {moodTotal === 0 ? (
              <p style={{ color: "#a58da5", fontSize: "13px" }}>
                まだ気分の記録がありません。
              </p>
            ) : (
              <div style={{ display: "grid", gap: "15px" }}>
                {[
                  { name: "元気", emoji: "😊", color: "#e9b4cf" },
                  { name: "普通", emoji: "😐", color: "#c9b9e9" },
                  { name: "疲れた", emoji: "😴", color: "#b7c8e8" },
                ].map((item) => (
                  <div key={item.name}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "6px",
                        fontSize: "14px",
                      }}
                    >
                      <span>{item.emoji} {item.name}</span>
                      <strong>
                        {moodCounts[item.name as keyof typeof moodCounts]} 回
                      </strong>
                    </div>
                    <div
                      style={{
                        background: "#f5edf5",
                        height: "10px",
                        borderRadius: "20px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${
                            (moodCounts[item.name as keyof typeof moodCounts] /
                              moodTotal) *
                            100
                          }%`,
                          height: "100%",
                          background: item.color,
                          borderRadius: "20px",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </section>

        {/* 週間グラフ */}
        <section style={{ marginBottom: "32px" }}>
          <p style={{ color: "#b18aa9", letterSpacing: "2px", fontSize: "12px" }}>
            WEEKLY TRACKER
          </p>
          <h2 style={sectionTitle}>週間レポート 📊</h2>
          <p style={{ fontSize: "13px", color: "#987b9c" }}>
            {formatDate(weekData[0].key)} ～ {formatDate(weekData[6].key)}
          </p>

          <div className="wellness-grid">
            {renderChart(
              "水分補給",
              "💧",
              weekData.map((d) => ({ label: d.label, value: d.water })),
              maxWater,
              "杯",
              "linear-gradient(180deg,#c7b7ed,#e8b7d3)"
            )}

            {renderChart(
              "睡眠時間",
              "🌙",
              weekData.map((d) => ({ label: d.label, value: d.sleep })),
              maxSleep,
              "時間",
              "linear-gradient(180deg,#b9a8e8,#d7c9f3)"
            )}

            {renderChart(
              "運動時間",
              "🏃",
              weekData.map((d) => ({ label: d.label, value: d.exercise })),
              maxExercise,
              "分",
              "linear-gradient(180deg,#e7aaca,#f4c9d9)"
            )}
          </div>
        </section>

        {/* 過去の記録一覧 */}
        <section style={{ marginBottom: "32px" }}>
          <p style={{ color: "#b18aa9", letterSpacing: "2px", fontSize: "12px" }}>
            RECORD HISTORY
          </p>
          <h2 style={sectionTitle}>過去の記録 📖</h2>

          <div style={cardStyle}>
            <h3>
              {monthCursor.getFullYear()}年
              {monthCursor.getMonth() + 1}月の記録
            </h3>

            {monthEntries.length === 0 ? (
              <p style={{ color: "#a58da5", textAlign: "center" }}>
                この月の記録はまだありません。
              </p>
            ) : (
              <div style={{ display: "grid", gap: "10px" }}>
                {monthEntries.map(([key, data]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedDate(key);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "15px",
                      borderRadius: "14px",
                      border:
                        selectedDate === key
                          ? "2px solid #c49ac8"
                          : "1px solid #f1e5ef",
                      background: selectedDate === key ? "#f7effa" : "#fff9fc",
                      color: "#594b5d",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "10px",
                        flexWrap: "wrap",
                      }}
                    >
                      <strong>{formatDate(key)}</strong>
                      <span style={{ color: "#987b9c", fontSize: "13px" }}>
                        {data.mood || "気分未記録"}
                      </span>
                    </div>

                    <p
                      style={{
                        margin: "8px 0 0",
                        fontSize: "13px",
                        color: "#9b849c",
                      }}
                    >
                      💧 {data.water}杯　🌙 {data.sleep}時間　
                      🏃 {data.exercise}分
                    </p>

                    {data.mealNote && (
                      <p
                        style={{
                          margin: "8px 0 0",
                          fontSize: "13px",
                          color: "#987b9c",
                          overflowWrap: "anywhere",
                        }}
                      >
                        🍰 {data.mealNote}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <footer
          style={{
            textAlign: "center",
            color: "#b49bb3",
            fontSize: "13px",
            padding: "15px",
          }}
        >
          Made with ♡ Wellness Note
          <p>自分のペースで、少しずつ。</p>
        </footer>
      </main>
    </div>
  );
};

export default App;
