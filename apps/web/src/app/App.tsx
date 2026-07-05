import { BarChart3, BookOpen, CircleUserRound, Plus } from "lucide-react";

const tabs = [
  { label: "明细", icon: BookOpen },
  { label: "图表", icon: BarChart3 },
  { label: "记账", icon: Plus, primary: true },
  { label: "我的", icon: CircleUserRound }
];

export function App() {
  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">Accounting App</p>
        <h1>记账 APP 工程骨架</h1>
        <p className="hero-copy">Phase 0 已建立前端入口，后续将在这里落地明细、图表、记账和我的四个核心页面。</p>
      </section>

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

