import { useState, useEffect } from "react";
import { redirect, useNavigate } from "react-router";
import { api } from "../utils/serviceAPI";
import type { User, SchoolClass, Fundraiser } from "../utils/serviceAPI";
import {
  FaWallet,
  FaPlusCircle,
  FaSchool,
  FaDonate,
  FaArrowRight,
  FaMoneyBillWave,
} from "react-icons/fa";

export async function clientLoader() {
  if (!api.isAuthenticated()) {
    throw redirect("/");
  }
  return {};
}

export default function Home() {
  const navigate = useNavigate();
  const user = api.getUser();
  const [balance, setBalance] = useState<number | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositMsg, setDepositMsg] = useState<{ type: string; text: string } | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [cls, me] = await Promise.all([
        api.getMyClasses(),
        api.getMe(),
      ]);
      setClasses(cls);
      setBalance(me.balance);

      // Load fundraisers for all classes
      const allFundraisers: Fundraiser[] = [];
      for (const c of cls) {
        const frs = await api.getClassFundraisers(c.id);
        allFundraisers.push(...frs);
      }
      setFundraisers(allFundraisers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      setDepositLoading(true);
      const updatedUser = await api.deposit(amount);
      setBalance(updatedUser.balance);
      setDepositAmount("");
      setDepositMsg({ type: "success", text: `Wpłacono ${amount.toFixed(2)} PLN na konto!` });
      setTimeout(() => setDepositMsg(null), 3000);
    } catch (e: any) {
      setDepositMsg({ type: "error", text: e?.message || "Błąd wpłaty" });
    } finally {
      setDepositLoading(false);
    }
  }

  const activeFundraisers = fundraisers.filter((f) => f.status === "ACTIVE" && !f.blocked);

  return (
    <div className="animate-fade-in">
      {/* Welcome */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
          Witaj, {user?.firstName}! 👋
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: 4 }}>
          Panel główny SchoolMoney
        </p>
      </div>

      {/* Stats Row */}
      <div className="stats-grid" style={{ marginBottom: 32 }}>
        <div className="stat-card">
          <FaWallet style={{ color: "var(--color-primary)", fontSize: "1.5rem" }} />
          <div className="stat-value">
            {balance !== null ? `${balance.toFixed(2)} PLN` : "— PLN"}
          </div>
          <div className="stat-label">Saldo konta</div>
        </div>
        <div className="stat-card">
          <FaSchool style={{ color: "var(--color-info)", fontSize: "1.5rem" }} />
          <div className="stat-value" style={{ color: "var(--color-info)" }}>
            {classes.length}
          </div>
          <div className="stat-label">Twoich klas</div>
        </div>
        <div className="stat-card">
          <FaDonate style={{ color: "var(--color-success)", fontSize: "1.5rem" }} />
          <div className="stat-value" style={{ color: "var(--color-success)" }}>
            {activeFundraisers.length}
          </div>
          <div className="stat-label">Aktywnych zbiórek</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Deposit Card */}
        <div className="card" style={{ gridColumn: window.innerWidth < 768 ? "1 / -1" : undefined }}>
          <div className="card-header">
            <div className="card-title">
              <FaMoneyBillWave style={{ marginRight: 8, color: "var(--color-primary)" }} />
              Wpłata na konto
            </div>
          </div>

          {depositMsg && (
            <div className={`alert ${depositMsg.type === "success" ? "alert-success" : "alert-error"}`}>
              {depositMsg.text}
            </div>
          )}

          <form onSubmit={handleDeposit} style={{ display: "flex", gap: 12 }}>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="form-input"
              placeholder="Kwota PLN"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={depositLoading}
            >
              <FaPlusCircle />
              {depositLoading ? "..." : "Wpłać"}
            </button>
          </form>
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ gridColumn: window.innerWidth < 768 ? "1 / -1" : undefined }}>
          <div className="card-header">
            <div className="card-title">Szybkie akcje</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button className="btn btn-secondary" style={{ justifyContent: "space-between" }} onClick={() => navigate("/rodzicPanel")}>
              Zarządzaj dziećmi
              <FaArrowRight style={{ opacity: 0.5 }} />
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: "space-between" }} onClick={() => navigate("/klasa")}>
              Przeglądaj klasy
              <FaArrowRight style={{ opacity: 0.5 }} />
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: "space-between" }} onClick={() => navigate("/zbiorki")}>
              Przeglądaj zbiórki
              <FaArrowRight style={{ opacity: 0.5 }} />
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: "space-between" }} onClick={() => navigate("/chat")}>
              Otwórz czat
              <FaArrowRight style={{ opacity: 0.5 }} />
            </button>
          </div>
        </div>
      </div>

      {/* Active Fundraisers */}
      {activeFundraisers.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-header">
            <div className="card-title">
              <FaDonate style={{ marginRight: 8, color: "var(--color-primary)" }} />
              Aktywne zbiórki
            </div>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tytuł</th>
                  <th>Kwota/dziecko</th>
                  <th>Zebrano</th>
                  <th>Data końca</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {activeFundraisers.slice(0, 5).map((f) => (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {f.logoUrl && (
                          <img src={f.logoUrl} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
                        )}
                        {f.title}
                      </div>
                    </td>
                    <td>{f.amountPerChild?.toFixed(2)} PLN</td>
                    <td style={{ fontWeight: 600, color: "var(--color-success)" }}>{f.balance?.toFixed(2)} PLN</td>
                    <td>{f.endDate}</td>
                    <td>
                      <span className="badge badge-success">Aktywna</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Responsive style */}
      <style>{`
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: 1fr !important; }
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
