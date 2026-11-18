
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import "./App.css";

type Kind = "income" | "expense" | "saving";

type Transaction = {
  id: string;
  kind: Kind;
  name: string;
  category: string;
  amount: number;
  date: string;
};

const STORAGE_KEY = "monee-transactions";
const GOAL_KEY = "monee-goal";
const INITIAL_KEY = "monee-initial";

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const categories: Record<Kind, string[]> = {
  income: ["アルバイト", "お小遣い", "臨時収入", "その他"],
  expense: ["食費", "交通費", "美容", "洋服", "趣味・遊び", "学校関係", "日用品", "その他"],
  saving: ["旅行", "欲しいもの", "将来のため", "その他"],
};

const yen = (n: number) =>
  `¥${Math.round(n).toLocaleString("ja-JP")}`;

function readTransactions(): Transaction[] {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(readTransactions);
  const [goal, setGoal] = useState(() =>
    Number(localStorage.getItem(GOAL_KEY)) || 100000
  );
  const [initial, setInitial] = useState(() =>
    Number(localStorage.getItem(INITIAL_KEY)) || 0
  );

  const [kind, setKind] = useState<Kind>("expense");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("食費");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [month, setMonth] = useState(today().slice(0, 7));
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(GOAL_KEY, String(goal));
  }, [goal]);

  useEffect(() => {
    localStorage.setItem(INITIAL_KEY, String(initial));
  }, [initial]);

  const monthly = useMemo(
    () => transactions.filter((t) => t.date.startsWith(month)),
    [transactions, month]
  );

  const income = monthly
    .filter((t) => t.kind === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = monthly
    .filter((t) => t.kind === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const savings = transactions
    .filter((t) => t.kind === "saving")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = initial +
    transactions.reduce((sum, t) => {
      if (t.kind === "income") return sum + t.amount;
      return sum - t.amount;
    }, 0);

  const progress = goal > 0
    ? Math.min(100, (savings / goal) * 100)
    : 0;

  const filtered = monthly
    .filter((t) => filter === "all" || t.kind === filter)
    .sort((a, b) => b.date.localeCompare(a.date));

  const categoryTotals = categories.expense.map((c) => ({
    name: c,
    total: monthly
      .filter((t) => t.kind === "expense" && t.category === c)
      .reduce((sum, t) => sum + t.amount, 0),
  })).filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const maxCategory = Math.max(1, ...categoryTotals.map((c) => c.total));

  const changeKind = (next: Kind) => {
    setKind(next);
    setCategory(categories[next][0]);
  };

  const resetForm = () => {
    setName("");
    setAmount("");
    setDate(today());
    setEditingId(null);
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = Number(amount);

    if (!name.trim() || !Number.isFinite(value) || value <= 0 || value > 100000000) {
      alert("内容と金額を正しく入力してね！");
      return;
    }

    const item: Transaction = {
      id: editingId || crypto.randomUUID(),
      kind,
      name: name.trim(),
      category,
      amount: value,
      date,
    };

    if (editingId) {
      setTransactions((old) =>
        old.map((t) => t.id === editingId ? item : t)
      );
    } else {
      setTransactions((old) => [...old, item]);
    }

    resetForm();
  };

  const editTransaction = (t: Transaction) => {
    setKind(t.kind);
    setName(t.name);
    setCategory(t.category);
    setAmount(String(t.amount));
    setDate(t.date);
    setEditingId(t.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteTransaction = (id: string) => {
    if (window.confirm("この記録を削除する？")) {
      setTransactions((old) => old.filter((t) => t.id !== id));
      if (editingId === id) resetForm();
    }
  };

  const exportCSV = () => {
    const rows = [
      ["日付", "種類", "内容", "カテゴリ", "金額"],
      ...transactions.map((t) => [
        t.date,
        t.kind === "income" ? "収入" : t.kind === "expense" ? "支出" : "貯金",
        t.name,
        t.category,
        String(t.amount),
      ]),
    ];

    const csv = "\uFEFF" + rows
      .map((row) => row.map((v) => `"${v.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" })
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "monee-records.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetAll = () => {
    if (window.confirm("すべての記録を削除する？この操作は取り消せないよ。")) {
      setTransactions([]);
      setInitial(0);
      setGoal(100000);
      resetForm();
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <span className="brand-icon">♡</span>
          <div>
            <h1>monee<span>!</span></h1>
            <p>MY LITTLE MONEY NOTE</p>
          </div>
        </div>
        <div className="header-note">✎ お金のこと、楽しく記録しよう！</div>
      </header>

      <main>
        <section className="welcome">
          <div>
            <p className="eyebrow">HELLO, STUDENT !</p>
            <h2>今日のお金を、<br />かわいく管理しよう ♡</h2>
            <p>少しずつ記録して、理想の貯金に近づこう。</p>
          </div>
          <div className="welcome-doodle">✿<br /><span>¥</span><br />♡</div>
        </section>

        <section className="month-row">
          <h2>今月のお財布</h2>
          <input
            aria-label="表示する月"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </section>

        <section className="summary-grid">
          <article className="money-card balance-card">
            <span className="card-icon">👛</span>
            <p>現在の残高</p>
            <strong>{yen(balance)}</strong>
            <small>MY WALLET</small>
          </article>
          <article className="money-card income-card">
            <span className="card-icon">🌷</span>
            <p>今月の収入</p>
            <strong>{yen(income)}</strong>
            <small>INCOME</small>
          </article>
          <article className="money-card expense-card">
            <span className="card-icon">🍰</span>
            <p>今月の支出</p>
            <strong>{yen(expense)}</strong>
            <small>EXPENSE</small>
          </article>
          <article className="money-card saving-card">
            <span className="card-icon">🐷</span>
            <p>貯金の合計</p>
            <strong>{yen(savings)}</strong>
            <small>SAVINGS</small>
          </article>
        </section>

        <div className="main-grid">
          <section className="paper form-paper">
            <div className="section-title">
              <span>✎</span>
              <div>
                <h2>{editingId ? "記録を編集" : "お金を記録する"}</h2>
                <p>NEW MONEY NOTE</p>
              </div>
            </div>

            <div className="kind-tabs">
              <button className={kind === "income" ? "active income-tab" : ""} onClick={() => changeKind("income")}>＋ 収入</button>
              <button className={kind === "expense" ? "active expense-tab" : ""} onClick={() => changeKind("expense")}>− 支出</button>
              <button className={kind === "saving" ? "active saving-tab" : ""} onClick={() => changeKind("saving")}>♡ 貯金</button>
            </div>

            <form onSubmit={submit}>
              <label>何に使った？・何のお金？</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例：カフェ、アルバイト代"
                maxLength={40}
                required
              />

              <label>カテゴリ</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories[kind].map((c) => <option key={c}>{c}</option>)}
              </select>

              <label>金額（円）</label>
              <div className="amount-input">
                <span>¥</span>
                <input
                  type="number"
                  min="1"
                  max="100000000"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>

              <label>日付</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />

              <button className="submit-button" type="submit">
                {editingId ? "変更を保存 ♡" : "記録を追加 ♡"}
              </button>
              {editingId && (
                <button type="button" className="cancel-button" onClick={resetForm}>
                  編集をキャンセル
                </button>
              )}
            </form>
          </section>

          <div className="right-column">
            <section className="paper goal-paper">
              <div className="section-title">
                <span>🐷</span>
                <div>
                  <h2>わたしの貯金目標</h2>
                  <p>SAVING GOAL</p>
                </div>
              </div>
              <label>目標金額（円）</label>
              <input
                type="number"
                min="1"
                value={goal}
                onChange={(e) => setGoal(Math.max(0, Number(e.target.value)))}
              />
              <div className="goal-numbers">
                <strong>{yen(savings)}</strong>
                <span>/ {yen(goal)}</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <p className="goal-message">
                {progress >= 100 ? "目標達成！おめでとう ♡" : `目標まであと ${yen(Math.max(0, goal - savings))}！`}
              </p>
              <div className="goal-doodle">✿ がんばりすぎず、コツコツ ✿</div>
            </section>

            <section className="paper initial-paper">
              <h2>最初のお財布残高</h2>
              <p>アプリを使い始める前の残高を設定できるよ。</p>
              <div className="amount-input">
                <span>¥</span>
                <input
                  type="number"
                  min="0"
                  value={initial}
                  onChange={(e) => setInitial(Math.max(0, Number(e.target.value)))}
                />
              </div>
            </section>
          </div>
        </div>

        <section className="paper analysis-paper">
          <div className="section-title">
            <span>✿</span>
            <div>
              <h2>今月の支出チェック</h2>
              <p>WHERE DID MY MONEY GO?</p>
            </div>
          </div>
          {categoryTotals.length === 0 ? (
            <p className="empty">まだ支出の記録がないよ。記録してみよう！ ♡</p>
          ) : (
            <div className="category-list">
              {categoryTotals.map((c) => (
                <div className="category-item" key={c.name}>
                  <div className="category-label">
                    <span>{c.name}</span><strong>{yen(c.total)}</strong>
                  </div>
                  <div className="progress-track">
                    <div className="category-fill" style={{ width: `${c.total / maxCategory * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="paper history-paper">
          <div className="history-heading">
            <div className="section-title">
              <span>📒</span>
              <div>
                <h2>お金の記録</h2>
                <p>MY MONEY DIARY</p>
              </div>
            </div>
            <div className="filter-tabs">
              {[
                ["all", "全部"],
                ["income", "収入"],
                ["expense", "支出"],
                ["saving", "貯金"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={filter === value ? "selected" : ""}
                  onClick={() => setFilter(value)}
                >{label}</button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="empty">この月の記録はまだないよ。最初の記録を書いてみよう！</p>
          ) : (
            <div className="transaction-list">
              {filtered.map((t) => (
                <article className="transaction" key={t.id}>
                  <div className={`transaction-icon ${t.kind}`}>
                    {t.kind === "income" ? "＋" : t.kind === "expense" ? "−" : "♡"}
                  </div>
                  <div className="transaction-info">
                    <strong>{t.name}</strong>
                    <span>{t.date} ・ {t.category}</span>
                  </div>
                  <strong className={`transaction-amount ${t.kind}`}>
                    {t.kind === "income" ? "+" : t.kind === "expense" ? "−" : "♡ "}
                    {yen(t.amount)}
                  </strong>
                  <div className="transaction-actions">
                    <button onClick={() => editTransaction(t)} aria-label="編集">✎</button>
                    <button onClick={() => deleteTransaction(t.id)} aria-label="削除">×</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="tools">
          <button onClick={exportCSV}>↓ CSVでバックアップ</button>
          <button className="danger-button" onClick={resetAll}>記録をすべて削除</button>
        </section>

        <footer>
          <div>♡ monee ♡</div>
          <p>小さな記録が、大きな未来につながる。</p>
          <small>MADE WITH LOVE ✿</small>
        </footer>
      </main>
    </div>
  );
}

export default App;
