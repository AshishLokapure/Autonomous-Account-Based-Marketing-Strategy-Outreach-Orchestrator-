import { ArrowRight, CheckCircle2, FileText, Plus, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";

type FeaturePageProps = { active: string; eyebrow: string; title: string; description: string; metric: string; metricLabel: string; items: { title: string; detail: string; tag: string }[] };

export function FeaturePage({ active, eyebrow, title, description, metric, metricLabel, items }: FeaturePageProps) {
  return (
    <AppShell active={active}>
      <div className="content">
        <div className="header-row">
          <div>
            <div className="eyebrow">{eyebrow}</div>
            <h1 className="page-title">{title}</h1>
            <p className="subtle">{description}</p>
          </div>
          <button className="primary-button"><Plus size={16}/> Create new</button>
        </div>
        <div className="dashboard-grid">
          <div className="stack">
            <section className="card">
              <div className="chart-head">
                <div>
                  <h2 className="card-title">{title} overview</h2>
                  <p className="card-subtitle">AI-generated intelligence, verified against your account data</p>
                </div>
                <Sparkles size={18} color="var(--violet)"/>
              </div>
              {items.map((item) => (
                <div className="suggestion" key={item.title}>
                  <div className="suggestion-icon"><CheckCircle2 size={15}/></div>
                  <div style={{ flex: 1 }}>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                  <span className="tag">{item.tag}</span>
                </div>
              ))}
            </section>
            <section className="card">
              <div className="chart-head">
                <div>
                  <h2 className="card-title">Recommended next actions</h2>
                  <p className="card-subtitle">Ranked by expected account impact</p>
                </div>
                <span className="period">This week</span>
              </div>
              {["Review the latest verified evidence", "Assign an owner and due date", "Generate a personalized action plan"].map((action, index) => (
                <div className="activity" key={action}>
                  <div className="dotline"/>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <p><strong>{index + 1}. </strong>{action}</p>
                    <ArrowRight size={14} color="var(--blue)"/>
                  </div>
                </div>
              ))}
            </section>
          </div>
          <div className="stack">
            <section className="card">
              <div className="metric-label">{metricLabel}<span className="metric-icon teal"><Sparkles size={15}/></span></div>
              <div className="metric-number">{metric}</div>
              <div className="trend">↑ Updated from new evidence</div>
              <div className="progress"><span style={{ width: "82%" }}/></div>
            </section>
            <section className="card">
              <div className="chart-head">
                <div>
                  <h2 className="card-title">Evidence coverage</h2>
                  <p className="card-subtitle">Every insight traceable to a source</p>
                </div>
                <FileText size={17} color="var(--blue)"/>
              </div>
              <div className="funnel">
                {[["CRM records", "92%", "#4B73FF"], ["Meetings & email", "77%", "#7490FF"], ["Web research", "64%", "#9FB1FF"], ["Documents", "48%", "#C3CEFF"]].map(([label, width, color]) => (
                  <div className="funnel-row" key={label}>
                    <span className="funnel-label">{label}</span>
                    <div className="funnel-bar" style={{ width, background: color }}/>
                    <b className="funnel-value">{width}</b>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
