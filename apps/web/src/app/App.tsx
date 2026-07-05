import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  BarChart3,
  BookOpen,
  Camera,
  CircleUserRound,
  LogOut,
  Plus,
  ReceiptText,
  UserRoundCheck
} from "lucide-react";
import { clearToken, fetchMe, getStoredToken, login, register, storeToken, type AuthUser } from "../services/auth";
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  getAssetUrl,
  uploadBillImage,
  type Bill,
  type BillType,
  type Book,
  type Category,
  type CategoryRank,
  type MonthlyStats
} from "../services/api";

type TabKey = "detail" | "chart" | "record" | "profile";

const tabs: Array<{ key: TabKey; label: string; icon: typeof BookOpen; primary?: boolean }> = [
  { key: "detail", label: "明细", icon: BookOpen },
  { key: "chart", label: "图表", icon: BarChart3 },
  { key: "record", label: "记账", icon: Plus, primary: true },
  { key: "profile", label: "我的", icon: CircleUserRound }
];

const today = new Date().toISOString().slice(0, 10);
const currentMonth = today.slice(0, 7);

export function App() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("detail");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [month, setMonth] = useState(currentMonth);
  const [books, setBooks] = useState<Book[]>([]);
  const [currentBookId, setCurrentBookId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [chartType, setChartType] = useState<BillType>("expense");
  const [categoryRanks, setCategoryRanks] = useState<CategoryRank[]>([]);
  const [recordType, setRecordType] = useState<BillType>("expense");
  const [recordCategoryId, setRecordCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [remark, setRemark] = useState("");
  const [happenedAt, setHappenedAt] = useState(today);
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [newBookName, setNewBookName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");

  const activeCategories = useMemo(
    () => categories.filter((category) => category.type === recordType && category.isActive),
    [categories, recordType]
  );

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;

    fetchMe(token)
      .then((nextUser) => {
        setUser(nextUser);
        return loadWorkspace();
      })
      .catch(() => clearToken());
  }, []);

  useEffect(() => {
    if (user && currentBookId) void loadBookData();
  }, [user, currentBookId, month, chartType]);

  useEffect(() => {
    if (!recordCategoryId && activeCategories[0]) {
      setRecordCategoryId(activeCategories[0].id);
    }
  }, [activeCategories, recordCategoryId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const result = mode === "login" ? await login(username, password) : await register(username, password);
      storeToken(result.token);
      setUser(result.user);
      setPassword("");
      await loadWorkspace();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "请求失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function loadWorkspace() {
    setIsLoading(true);
    setError("");
    try {
      const [bookPayload, categoryPayload] = await Promise.all([
        apiGet<{ books: Book[] }>("/books"),
        apiGet<{ categories: Category[] }>("/categories")
      ]);
      setBooks(bookPayload.books);
      setCategories(categoryPayload.categories);
      setCurrentBookId((previous) => previous || bookPayload.books[0]?.id || "");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "加载失败");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadBookData() {
    setIsLoading(true);
    setError("");
    try {
      const [billPayload, monthlyPayload, rankPayload] = await Promise.all([
        apiGet<{ bills: Bill[] }>(`/bills?bookId=${currentBookId}&month=${month}`),
        apiGet<{ stats: MonthlyStats }>(`/stats/monthly?bookId=${currentBookId}&month=${month}`),
        apiGet<{ categories: CategoryRank[] }>(
          `/stats/categories?bookId=${currentBookId}&month=${month}&type=${chartType}`
        )
      ]);
      setBills(billPayload.bills);
      setMonthlyStats(monthlyPayload.stats);
      setCategoryRanks(rankPayload.categories);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "加载失败");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateBill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentBookId || !recordCategoryId) {
      setError("请选择账本和分类");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const imageUrl = voucherFile ? (await uploadBillImage(voucherFile)).imageUrl : null;
      await apiPost<{ bill: Bill }>("/bills", {
        bookId: currentBookId,
        categoryId: recordCategoryId,
        type: recordType,
        amount,
        remark,
        imageUrl,
        happenedAt: `${happenedAt}T12:00:00.000Z`
      });
      setAmount("");
      setRemark("");
      setVoucherFile(null);
      setNotice("已记一笔");
      setActiveTab("detail");
      await loadBookData();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "保存失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateBook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newBookName.trim()) return;
    const payload = await apiPost<{ book: Book }>("/books", { name: newBookName });
    setBooks((previous) => [...previous, payload.book]);
    setCurrentBookId(payload.book.id);
    setNewBookName("");
  }

  async function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newCategoryName.trim()) return;
    const payload = await apiPost<{ category: Category }>("/categories", {
      type: recordType,
      name: newCategoryName,
      icon: "custom"
    });
    setCategories((previous) => [...previous, payload.category]);
    setNewCategoryName("");
  }

  async function handleDisableCategory(categoryId: string) {
    if (!window.confirm("确认停用这个分类？")) return;
    const payload = await apiPatch<{ category: Category }>(`/categories/${categoryId}/disable`, {});
    setCategories((previous) => previous.map((item) => (item.id === categoryId ? payload.category : item)));
  }

  async function handleDeleteBill(billId: string) {
    if (!window.confirm("确认删除这笔账单？")) return;
    await apiDelete(`/bills/${billId}`);
    await loadBookData();
  }

  async function handleDeleteBook(bookId: string) {
    if (!window.confirm("确认删除这个账本？账本下的账单和图片凭证也会删除。")) return;
    await apiDelete(`/books/${bookId}`);
    const remainingBooks = books.filter((book) => book.id !== bookId);
    setBooks(remainingBooks);
    setCurrentBookId((previous) => (previous === bookId ? remainingBooks[0]?.id ?? "" : previous));
  }

  function handleLogout() {
    clearToken();
    setUser(null);
    setPassword("");
    setBills([]);
    setBooks([]);
    setCategories([]);
  }

  if (!user) {
    return (
      <main className="app-shell">
        <AuthPanel
          error={error}
          isSubmitting={isSubmitting}
          mode={mode}
          password={password}
          setMode={setMode}
          setPassword={setPassword}
          setUsername={setUsername}
          username={username}
          onSubmit={handleSubmit}
        />
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="phone-surface" aria-label="记账应用">
        <header className="top-band">
          <div>
            <p className="eyebrow">Accounting App</p>
            <h1>{tabs.find((tab) => tab.key === activeTab)?.label}</h1>
          </div>
          <select value={currentBookId} onChange={(event) => setCurrentBookId(event.target.value)} aria-label="当前账本">
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.name}
              </option>
            ))}
          </select>
        </header>

        {error ? <p className="form-error page-message">{error}</p> : null}
        {notice ? <p className="success-message page-message">{notice}</p> : null}
        {isLoading ? <p className="muted-message page-message">加载中</p> : null}

        {activeTab === "detail" ? (
          <DetailPage
            bills={bills}
            categories={categories}
            month={month}
            monthlyStats={monthlyStats}
            onDeleteBill={handleDeleteBill}
            setMonth={setMonth}
          />
        ) : null}
        {activeTab === "chart" ? (
          <ChartPage chartType={chartType} monthlyStats={monthlyStats} ranks={categoryRanks} setChartType={setChartType} />
        ) : null}
        {activeTab === "record" ? (
          <RecordPage
            amount={amount}
            categories={activeCategories}
            happenedAt={happenedAt}
            isSubmitting={isSubmitting}
            recordCategoryId={recordCategoryId}
            recordType={recordType}
            remark={remark}
            setAmount={setAmount}
            setHappenedAt={setHappenedAt}
            setRecordCategoryId={setRecordCategoryId}
            setRecordType={(nextType) => {
              setRecordType(nextType);
              setRecordCategoryId("");
            }}
            setRemark={setRemark}
            setVoucherFile={setVoucherFile}
            voucherFile={voucherFile}
            onSubmit={handleCreateBill}
          />
        ) : null}
        {activeTab === "profile" ? (
          <ProfilePage
            books={books}
            categories={categories}
            newBookName={newBookName}
            newCategoryName={newCategoryName}
            recordType={recordType}
            user={user}
            onCreateBook={handleCreateBook}
            onCreateCategory={handleCreateCategory}
            onDeleteBook={handleDeleteBook}
            onDisableCategory={handleDisableCategory}
            onLogout={handleLogout}
            setNewBookName={setNewBookName}
            setNewCategoryName={setNewCategoryName}
          />
        ) : null}
      </section>
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </main>
  );
}

function AuthPanel(props: {
  error: string;
  isSubmitting: boolean;
  mode: "login" | "register";
  password: string;
  setMode: (mode: "login" | "register") => void;
  setPassword: (value: string) => void;
  setUsername: (value: string) => void;
  username: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="auth-panel" aria-label="登录注册">
      <div className="auth-title">
        <UserRoundCheck aria-hidden="true" size={26} />
        <div>
          <p className="eyebrow">Accounting App</p>
          <h1>{props.mode === "login" ? "登录" : "注册"}</h1>
        </div>
      </div>
      <div className="segmented-control" aria-label="认证模式">
        <button className={props.mode === "login" ? "active" : ""} type="button" onClick={() => props.setMode("login")}>
          登录
        </button>
        <button
          className={props.mode === "register" ? "active" : ""}
          type="button"
          onClick={() => props.setMode("register")}
        >
          注册
        </button>
      </div>
      <form className="auth-form" onSubmit={props.onSubmit}>
        <label>
          用户名
          <input
            value={props.username}
            minLength={3}
            maxLength={20}
            onChange={(event) => props.setUsername(event.target.value)}
          />
        </label>
        <label>
          密码
          <input
            value={props.password}
            minLength={6}
            type="password"
            onChange={(event) => props.setPassword(event.target.value)}
          />
        </label>
        {props.error ? <p className="form-error">{props.error}</p> : null}
        <button className="primary-action" type="submit" disabled={props.isSubmitting}>
          {props.isSubmitting ? "处理中" : props.mode === "login" ? "登录" : "注册"}
        </button>
      </form>
    </section>
  );
}

function TabBar({ activeTab, setActiveTab }: { activeTab: TabKey; setActiveTab: (tab: TabKey) => void }) {
  return (
    <nav className="tab-bar" aria-label="主导航">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            className={tab.primary ? "tab-item tab-item-primary" : "tab-item"}
            key={tab.key}
            type="button"
            aria-current={activeTab === tab.key ? "page" : undefined}
            onClick={() => setActiveTab(tab.key)}
          >
            <Icon aria-hidden="true" size={tab.primary ? 30 : 22} strokeWidth={2.2} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function DetailPage(props: {
  bills: Bill[];
  categories: Category[];
  month: string;
  monthlyStats: MonthlyStats | null;
  onDeleteBill: (billId: string) => void;
  setMonth: (month: string) => void;
}) {
  const categoryById = new Map(props.categories.map((category) => [category.id, category]));
  const grouped = groupBillsByDate(props.bills);

  return (
    <section className="page-stack">
      <div className="month-row">
        <input type="month" value={props.month} onChange={(event) => props.setMonth(event.target.value)} aria-label="月份" />
      </div>
      <div className="summary-strip">
        <span>收入</span>
        <strong>{props.monthlyStats?.income ?? "0.00"}</strong>
        <span>支出</span>
        <strong>{props.monthlyStats?.expense ?? "0.00"}</strong>
        <span>结余</span>
        <strong>{props.monthlyStats?.balance ?? "0.00"}</strong>
      </div>
      {props.bills.length === 0 ? (
        <div className="empty-state">
          <ReceiptText aria-hidden="true" />
          <p>暂无账单</p>
        </div>
      ) : (
        [...grouped.entries()].map(([date, bills]) => (
          <div className="day-group" key={date}>
            <div className="day-header">
              <span>{date}</span>
              <span>{formatDayTotal(bills)}</span>
            </div>
            {bills.map((bill) => {
              const category = categoryById.get(bill.categoryId);
              return (
                <article className="bill-row" key={bill.id}>
                  <div className="category-icon">{category?.name.slice(0, 1) ?? "账"}</div>
                  <div>
                    <strong>{category?.name ?? "分类"}</strong>
                    <p>{bill.remark || "无备注"}</p>
                    {bill.imageUrl ? <img alt="图片凭证" className="voucher-thumb" src={getAssetUrl(bill.imageUrl)} /> : null}
                  </div>
                  <span className={bill.type === "expense" ? "amount expense" : "amount income"}>
                    {bill.type === "expense" ? "-" : "+"}
                    {bill.amount}
                  </span>
                  <button className="danger-link" type="button" onClick={() => props.onDeleteBill(bill.id)}>
                    删除
                  </button>
                </article>
              );
            })}
          </div>
        ))
      )}
    </section>
  );
}

function ChartPage(props: {
  chartType: BillType;
  monthlyStats: MonthlyStats | null;
  ranks: CategoryRank[];
  setChartType: (type: BillType) => void;
}) {
  const total = props.chartType === "expense" ? props.monthlyStats?.expense : props.monthlyStats?.income;
  const average = props.chartType === "expense" ? props.monthlyStats?.averageDailyExpense : props.monthlyStats?.averageDailyIncome;

  return (
    <section className="page-stack">
      <div className="segmented-control">
        <button className={props.chartType === "expense" ? "active" : ""} type="button" onClick={() => props.setChartType("expense")}>
          支出
        </button>
        <button className={props.chartType === "income" ? "active" : ""} type="button" onClick={() => props.setChartType("income")}>
          收入
        </button>
      </div>
      <div className="metric-grid">
        <div>
          <span>总金额</span>
          <strong>{total ?? "0.00"}</strong>
        </div>
        <div>
          <span>日均</span>
          <strong>{average ?? "0.00"}</strong>
        </div>
      </div>
      <TrendLine stats={props.monthlyStats} type={props.chartType} />
      <div className="rank-list">
        {props.ranks.length === 0 ? <p className="muted-message">暂无排行</p> : null}
        {props.ranks.map((rank) => (
          <div className="rank-row" key={rank.categoryId}>
            <div className="rank-title">
              <span>{rank.categoryName}</span>
              <strong>{rank.amount}</strong>
            </div>
            <div className="progress-track">
              <span style={{ width: `${Math.min(rank.percent, 100)}%` }} />
            </div>
            <small>{rank.percent}%</small>
          </div>
        ))}
      </div>
    </section>
  );
}

function TrendLine({ stats, type }: { stats: MonthlyStats | null; type: BillType }) {
  const values = stats?.trend.map((point) => Number(type === "expense" ? point.expense : point.income)) ?? [];
  const max = Math.max(...values, 1);
  const points = values
    .map((value, index) => {
      const x = values.length <= 1 ? 0 : (index / (values.length - 1)) * 300;
      const y = 100 - (value / max) * 90;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className="trend-line" viewBox="0 0 300 110" role="img" aria-label="月度趋势折线图">
      <polyline points={points} fill="none" stroke="#222" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RecordPage(props: {
  amount: string;
  categories: Category[];
  happenedAt: string;
  isSubmitting: boolean;
  recordCategoryId: string;
  recordType: BillType;
  remark: string;
  voucherFile: File | null;
  setAmount: (value: string) => void;
  setHappenedAt: (value: string) => void;
  setRecordCategoryId: (value: string) => void;
  setRecordType: (type: BillType) => void;
  setRemark: (value: string) => void;
  setVoucherFile: (file: File | null) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="page-stack" onSubmit={props.onSubmit}>
      <div className="segmented-control">
        <button className={props.recordType === "expense" ? "active" : ""} type="button" onClick={() => props.setRecordType("expense")}>
          支出
        </button>
        <button className={props.recordType === "income" ? "active" : ""} type="button" onClick={() => props.setRecordType("income")}>
          收入
        </button>
      </div>
      <div className="category-grid">
        {props.categories.map((category) => (
          <button
            className={props.recordCategoryId === category.id ? "category-chip active" : "category-chip"}
            key={category.id}
            type="button"
            onClick={() => props.setRecordCategoryId(category.id)}
          >
            <span>{category.name.slice(0, 1)}</span>
            {category.name}
          </button>
        ))}
      </div>
      <input
        className="amount-input"
        inputMode="decimal"
        placeholder="0.00"
        value={props.amount}
        onChange={(event) => props.setAmount(event.target.value)}
        aria-label="金额"
      />
      <textarea placeholder="备注" value={props.remark} onChange={(event) => props.setRemark(event.target.value)} />
      <input type="date" value={props.happenedAt} onChange={(event) => props.setHappenedAt(event.target.value)} aria-label="日期" />
      <label className="upload-line">
        <Camera aria-hidden="true" size={18} />
        图片凭证
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => props.setVoucherFile(event.target.files?.[0] ?? null)}
        />
      </label>
      {props.voucherFile ? <p className="muted-message">{props.voucherFile.name}</p> : null}
      <button className="primary-action" type="submit" disabled={props.isSubmitting}>
        完成
      </button>
    </form>
  );
}

function ProfilePage(props: {
  books: Book[];
  categories: Category[];
  newBookName: string;
  newCategoryName: string;
  recordType: BillType;
  user: AuthUser;
  onCreateBook: (event: FormEvent<HTMLFormElement>) => void;
  onCreateCategory: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteBook: (bookId: string) => void;
  onDisableCategory: (categoryId: string) => void;
  onLogout: () => void;
  setNewBookName: (value: string) => void;
  setNewCategoryName: (value: string) => void;
}) {
  return (
    <section className="page-stack">
      <div className="profile-head">
        <CircleUserRound aria-hidden="true" />
        <div>
          <strong>{props.user.nickname || props.user.username}</strong>
          <p>{props.user.username}</p>
        </div>
        <button className="icon-button" type="button" aria-label="退出登录" onClick={props.onLogout}>
          <LogOut aria-hidden="true" size={20} />
        </button>
      </div>
      <form className="inline-form" onSubmit={props.onCreateBook}>
        <input value={props.newBookName} placeholder="新账本" onChange={(event) => props.setNewBookName(event.target.value)} />
        <button type="submit">添加</button>
      </form>
      <div className="plain-list">
        {props.books.map((book) => (
          <button key={book.id} type="button" onClick={() => props.onDeleteBook(book.id)}>
            {book.name}
          </button>
        ))}
      </div>
      <form className="inline-form" onSubmit={props.onCreateCategory}>
        <input
          value={props.newCategoryName}
          placeholder={`新增${props.recordType === "expense" ? "支出" : "收入"}分类`}
          onChange={(event) => props.setNewCategoryName(event.target.value)}
        />
        <button type="submit">添加</button>
      </form>
      <div className="plain-list">
        {props.categories.slice(0, 12).map((category) => (
          <button key={category.id} type="button" disabled={!category.isActive} onClick={() => props.onDisableCategory(category.id)}>
            {category.name}
          </button>
        ))}
      </div>
    </section>
  );
}

function groupBillsByDate(bills: Bill[]) {
  const grouped = new Map<string, Bill[]>();
  for (const bill of bills) {
    const date = new Date(bill.happenedAt).toISOString().slice(0, 10);
    grouped.set(date, [...(grouped.get(date) ?? []), bill]);
  }
  return grouped;
}

function formatDayTotal(bills: Bill[]) {
  const total = bills.reduce((sum, bill) => sum + (bill.type === "income" ? Number(bill.amount) : -Number(bill.amount)), 0);
  return total.toFixed(2);
}
