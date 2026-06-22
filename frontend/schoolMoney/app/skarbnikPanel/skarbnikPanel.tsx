import { useState, useEffect } from "react";
import { redirect } from "react-router";
import { api } from "../utils/serviceAPI";
import type { SchoolClass, Fundraiser, Transaction } from "../utils/serviceAPI";
import {
  FaChartBar,
  FaDonate,
  FaSchool,
  FaFileAlt,
  FaDownload,
  FaMoneyBillWave,
} from "react-icons/fa";

export async function clientLoader() {
  if (!api.isAuthenticated()) throw redirect("/");
  return {};
}

export default function SkarbnikPanel() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [classTransactions, setClassTransactions] = useState<Transaction[]>([]);
  const [fundraiserTransactions, setFundraiserTransactions] = useState<Transaction[]>([]);
  const [selectedFundraiserId, setSelectedFundraiserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<"class" | "fundraiser">("class");

  useEffect(() => { loadClasses(); }, []);
  useEffect(() => {
    if (selectedClassId) {
      loadClassData();
    }
  }, [selectedClassId]);

  useEffect(() => {
    if (selectedFundraiserId) {
      loadFundraiserReport();
    }
  }, [selectedFundraiserId]);

  async function loadClasses() {
    try {
      const cls = await api.getMyClasses();
      setClasses(cls);
      if (cls.length > 0) setSelectedClassId(cls[0].id);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function loadClassData() {
    try {
      const [frs, txs] = await Promise.all([
        api.getClassFundraisers(selectedClassId),
        api.getClassTransactions(selectedClassId),
      ]);
      setFundraisers(frs);
      setClassTransactions(txs);
      if (frs.length > 0) {
        setSelectedFundraiserId(frs[0].id);
      }
    } catch (e) { console.error(e); }
  }

  async function loadFundraiserReport() {
    try {
      const txs = await api.getFundraiserTransactions(selectedFundraiserId);
      setFundraiserTransactions(txs);
    } catch (e) { console.error(e); }
  }

  function exportTableAsCSV(transactions: Transaction[], filename: string) {
    const header = "ID,Typ,Kwota,Data,From,To\n";
    const rows = transactions.map(t =>
      `${t.id},${t.type},${t.amount},${new Date(t.timestamp).toLocaleString("pl-PL")},${t.fromAccountNumber || ""},${t.toAccountNumber || ""}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const currentTransactions = reportType === "class" ? classTransactions : fundraiserTransactions;
  const totalIn = currentTransactions.filter(t => t.type === "PAYMENT_FOR_CHILD" || t.type === "DEPOSIT").reduce((s, t) => s + (t.amount || 0), 0);
  const totalOut = currentTransactions.filter(t => t.type === "WITHDRAWAL" || t.type === "EXTERNAL_WITHDRAWAL" || t.type === "REFUND").reduce((s, t) => s + (t.amount || 0), 0);

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
          <FaChartBar style={{ marginRight: 10, color: "var(--color-primary)" }} />
          Panel Skarbnika
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: 4, fontSize: "0.9rem" }}>
          Raporty finansowe i przegląd zbiórek
        </p>
      </div>

      {loading ? (
        <div className="empty-state">Ładowanie...</div>
      ) : classes.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <FaSchool style={{ fontSize: "3rem", opacity: 0.3 }} />
            <p>Nie jesteś skarbnikiem żadnej klasy</p>
          </div>
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
              <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
                <label className="form-label">Klasa</label>
                <select className="form-input" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
                <label className="form-label">Typ raportu</label>
                <select className="form-input" value={reportType} onChange={e => setReportType(e.target.value as any)}>
                  <option value="class">Raport klasy</option>
                  <option value="fundraiser">Raport zbiórki</option>
                </select>
              </div>
              {reportType === "fundraiser" && (
                <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
                  <label className="form-label">Zbiórka</label>
                  <select className="form-input" value={selectedFundraiserId} onChange={e => setSelectedFundraiserId(e.target.value)}>
                    {fundraisers.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
                  </select>
                </div>
              )}
              <button
                className="btn btn-secondary"
                onClick={() => exportTableAsCSV(currentTransactions, `raport_${reportType}_${new Date().toISOString().slice(0,10)}.csv`)}
              >
                <FaDownload /> Eksportuj CSV
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <FaMoneyBillWave style={{ color: "var(--color-success)", fontSize: "1.3rem" }} />
              <div className="stat-value" style={{ color: "var(--color-success)" }}>{totalIn.toFixed(2)} PLN</div>
              <div className="stat-label">Wpływy</div>
            </div>
            <div className="stat-card">
              <FaMoneyBillWave style={{ color: "var(--color-danger)", fontSize: "1.3rem" }} />
              <div className="stat-value" style={{ color: "var(--color-danger)" }}>{totalOut.toFixed(2)} PLN</div>
              <div className="stat-label">Wypłaty</div>
            </div>
            <div className="stat-card">
              <FaFileAlt style={{ color: "var(--color-info)", fontSize: "1.3rem" }} />
              <div className="stat-value" style={{ color: "var(--color-info)" }}>{currentTransactions.length}</div>
              <div className="stat-label">Transakcji</div>
            </div>
            <div className="stat-card">
              <FaDonate style={{ color: "var(--color-primary)", fontSize: "1.3rem" }} />
              <div className="stat-value">{fundraisers.length}</div>
              <div className="stat-label">Zbiórek w klasie</div>
            </div>
          </div>

          {/* Fundraisers overview */}
          {fundraisers.length > 0 && (
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-header">
                <div className="card-title">
                  <FaDonate style={{ marginRight: 8, color: "var(--color-primary)" }} />
                  Zbiórki w klasie
                </div>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tytuł</th>
                      <th>Kwota/dziecko</th>
                      <th>Saldo</th>
                      <th>Status</th>
                      <th>Okres</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fundraisers.map(f => (
                      <tr key={f.id}>
                        <td style={{ fontWeight: 600 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {f.logoUrl && (
                              <img src={f.logoUrl} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
                            )}
                            {f.title}
                          </div>
                        </td>
                        <td>{f.amountPerChild?.toFixed(2)} PLN</td>
                        <td style={{ fontWeight: 600, color: "var(--color-success)" }}>{f.balance?.toFixed(2)} PLN</td>
                        <td>
                          <span className={`badge ${f.status === "ACTIVE" ? "badge-success" : "badge-danger"}`}>
                            {f.status === "ACTIVE" ? "Aktywna" : "Zamknięta"}
                          </span>
                        </td>
                        <td style={{ fontSize: "0.8rem" }}>{f.startDate} → {f.endDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Transactions Table */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <FaFileAlt style={{ marginRight: 8, color: "var(--color-primary)" }} />
                Raport transakcji ({reportType === "class" ? "klasa" : "zbiórka"})
              </div>
            </div>
            {currentTransactions.length === 0 ? (
              <div className="empty-state">
                <p>Brak transakcji do wyświetlenia</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Typ</th>
                      <th>Kwota</th>
                      <th>Z konta</th>
                      <th>Na konto</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTransactions.map(t => (
                      <tr key={t.id}>
                        <td>
                          <span className={`badge ${
                            t.type === "PAYMENT_FOR_CHILD" ? "badge-success" :
                            t.type === "WITHDRAWAL" || t.type === "EXTERNAL_WITHDRAWAL" ? "badge-danger" :
                            t.type === "REFUND" ? "badge-warning" : "badge-info"
                          }`}>
                            {t.type === "PAYMENT_FOR_CHILD" ? "Wpłata za dziecko" :
                             t.type === "WITHDRAWAL" ? "Wypłata" :
                             t.type === "EXTERNAL_WITHDRAWAL" ? "Przelew zew." :
                             t.type === "REFUND" ? "Zwrot" :
                             t.type === "DEPOSIT" ? "Doładowanie" : t.type}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{t.amount?.toFixed(2)} PLN</td>
                        <td style={{ fontSize: "0.8rem", fontFamily: "monospace" }}>{t.fromAccountNumber || "—"}</td>
                        <td style={{ fontSize: "0.8rem", fontFamily: "monospace" }}>{t.toAccountNumber || "—"}</td>
                        <td style={{ fontSize: "0.85rem" }}>{new Date(t.timestamp).toLocaleString("pl-PL")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
