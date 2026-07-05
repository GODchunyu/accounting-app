import { useEffect, useState, type FormEvent } from "react";
import { BarChart3, BookOpen, CircleUserRound, LogOut, Plus, UserRoundCheck } from "lucide-react";
import { clearToken, fetchMe, getStoredToken, login, register, storeToken, type AuthUser } from "../services/auth";

const tabs = [
  { label: "明细", icon: BookOpen },
  { label: "图表", icon: BarChart3 },
  { label: "记账", icon: Plus, primary: true },
  { label: "我的", icon: CircleUserRound }
];

export function App() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      return;
    }

    fetchMe(token)
      .then(setUser)
      .catch(() => {
        clearToken();
      });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = mode === "login" ? await login(username, password) : await register(username, password);
      storeToken(result.token);
      setUser(result.user);
      setPassword("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "请求失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleLogout() {
    clearToken();
    setUser(null);
    setPassword("");
  }

  return (
    <main className="app-shell">
      {user ? (
        <section className="home-panel" aria-label="账户首页">
          <div className="home-header">
            <div>
              <p className="eyebrow">Accounting App</p>
              <h1>{user.nickname || user.username}</h1>
            </div>
            <button className="icon-button" type="button" aria-label="退出登录" onClick={handleLogout}>
              <LogOut aria-hidden="true" size={20} />
            </button>
          </div>
          <div className="summary-strip">
            <span>本月收入</span>
            <strong>0.00</strong>
            <span>本月支出</span>
            <strong>0.00</strong>
          </div>
        </section>
      ) : (
        <section className="auth-panel" aria-label="登录注册">
          <div className="auth-title">
            <UserRoundCheck aria-hidden="true" size={26} />
            <div>
              <p className="eyebrow">Accounting App</p>
              <h1>{mode === "login" ? "登录" : "注册"}</h1>
            </div>
          </div>
          <div className="segmented-control" aria-label="认证模式">
            <button className={mode === "login" ? "active" : ""} type="button" onClick={() => setMode("login")}>
              登录
            </button>
            <button className={mode === "register" ? "active" : ""} type="button" onClick={() => setMode("register")}>
              注册
            </button>
          </div>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              用户名
              <input value={username} minLength={3} maxLength={20} onChange={(event) => setUsername(event.target.value)} />
            </label>
            <label>
              密码
              <input
                value={password}
                minLength={6}
                type="password"
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button className="primary-action" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "处理中" : mode === "login" ? "登录" : "注册"}
            </button>
          </form>
        </section>
      )}

      <nav className="tab-bar" aria-label="主导航">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button className={tab.primary ? "tab-item tab-item-primary" : "tab-item"} key={tab.label} type="button">
              <Icon aria-hidden="true" size={tab.primary ? 30 : 22} strokeWidth={2.2} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </main>
  );
}
