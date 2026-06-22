import { useState, useEffect } from "react";
import { redirect } from "react-router";
import { api } from "../utils/serviceAPI";
import type { User, Fundraiser, Transaction } from "../utils/serviceAPI";
import {
  FaShieldAlt,
  FaUsers,
  FaUserTie,
  FaDonate,
  FaBan,
  FaCheck,
  FaFileAlt,
  FaDownload,
  FaSearch,
} from "react-icons/fa";

export async function clientLoader() {
  if (!api.isAuthenticated()) throw redirect("/");
  const user = api.getUser();
  if (user?.role !== "ROLE_ADMIN") throw redirect("/home");
  return {};
}

type Tab = "users" | "treasurers" | "fundraisers" | "reports" | "children";

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<User[]>([]);
  const [treasurers, setTreasurers] = useState<User[]>([]);
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [children, setChildren] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);
  const [search, setSearch] = useState("");

  // Reports
  const [reportType, setReportType] = useState<"fundraiser" | "class">("fundraiser");
  const [reportId, setReportId] = useState("");

  useEffect(() => { loadTab(); }, [tab]);

  async function loadTab() {
    try {
      setLoading(true);
      if (tab === "users") setUsers(await api.getAllUsers());
      else if (tab === "treasurers") setTreasurers(await api.getAllTreasurers());
      else if (tab === "fundraisers") setFundraisers(await api.getAllFundraisers());
      else if (tab === "children") setChildren(await api.getAdminChildren());
      else if (tab === "reports") {
        const [frs, cls] = await Promise.all([api.getAllFundraisers(), api.getAdminClasses()]);
        setFundraisers(frs);
        setClasses(cls);
        if (reportType === "fundraiser" && frs.length > 0 && !reportId) setReportId(frs[0].id);
        else if (reportType === "class" && cls.length > 0 && !reportId) setReportId(cls[0].id);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  // Update reportId when reportType changes
  useEffect(() => {
    if (tab === "reports") {
      if (reportType === "fundraiser" && fundraisers.length > 0) setReportId(fundraisers[0].id);
      else if (reportType === "class" && classes.length > 0) setReportId(classes[0].id);
      else setReportId("");
      setTransactions([]);
    }
  }, [reportType]);

  async function toggleBlock(userId: string) {
    try {
      const updated = await api.toggleUserBlock(userId);
      setUsers(prev => prev.map(u => u.id === userId ? updated : u));
      setTreasurers(prev => prev.map(u => u.id === userId ? updated : u));
      flash("success", updated.blocked ? "Użytkownik zablokowany" : "Użytkownik odblokowany");
    } catch (e: any) { flash("error", e?.message || "Błąd"); }
  }

  async function toggleFundraiserBlock(fId: string) {
    try {
      const updated = await api.toggleFundraiserBlock(fId);
      setFundraisers(prev => prev.map(f => f.id === fId ? updated : f));
      flash("success", updated.blocked ? "Zbiórka zablokowana" : "Zbiórka odblokowana");
    } catch (e: any) { flash("error", e?.message || "Błąd"); }
  }

  async function loadReport() {
    if (!reportId.trim()) return;
    try {
      setLoading(true);
      const txs = reportType === "fundraiser"
        ? await api.getAdminFundraiserReport(reportId.trim())
        : await api.getAdminClassReport(reportId.trim());
      setTransactions(txs);
    } catch (e: any) { flash("error", e?.message || "Nie znaleziono"); }
    finally { setLoading(false); }
  }

  function flash(type: string, text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  }

  function exportCSV() {
    const header = "ID,Typ,Kwota,Data,From,To\n";
    const rows = transactions.map(t =>
      `${t.id},${t.type},${t.amount},${new Date(t.timestamp).toLocaleString("pl-PL")},${t.fromAccountNumber || ""},${t.toAccountNumber || ""}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin_raport_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "users", label: "Użytkownicy", icon: <FaUsers /> },
    { id: "treasurers", label: "Skarbnicy", icon: <FaUserTie /> },
    { id: "fundraisers", label: "Zbiórki", icon: <FaDonate /> },
    { id: "children", label: "Dzieci", icon: <FaUsers /> },
    { id: "reports", label: "Raporty", icon: <FaFileAlt /> },
  ];

  const filteredUsers = (tab === "users" ? users : treasurers).filter(u =>
    !search || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const filteredFundraisers = fundraisers.filter(f =>
    !search || f.title.toLowerCase().includes(search.toLowerCase())
  );

  const filteredChildren = children.filter(c => 
    !search || `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
          <FaShieldAlt style={{ marginRight: 10, color: "var(--color-primary)" }} />
          Panel Administratora
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: 4, fontSize: "0.9rem" }}>
          Zarządzanie systemem SchoolMoney
        </p>
      </div>

      {msg && <div className={`alert ${msg.type === "success" ? "alert-success" : "alert-error"}`}>{msg.text}</div>}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button
            key={t.id}
            className={`btn ${tab === t.id ? "btn-primary" : "btn-secondary"}`}
            onClick={() => { setTab(t.id); setSearch(""); setTransactions([]); }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Search (for users/treasurers/fundraisers) */}
      {tab !== "reports" && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ position: "relative", maxWidth: 400 }}>
            <FaSearch style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              className="form-input"
              style={{ paddingLeft: 40 }}
              placeholder="Szukaj..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Users / Treasurers Tab */}
      {(tab === "users" || tab === "treasurers") && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              {tab === "users" ? <><FaUsers style={{ marginRight: 8 }} /> Wszyscy użytkownicy ({filteredUsers.length})</> : <><FaUserTie style={{ marginRight: 8 }} /> Skarbnicy ({filteredUsers.length})</>}
            </div>
          </div>
          {loading ? (
            <div className="empty-state">Ładowanie...</div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Imię i Nazwisko</th>
                    <th>Email</th>
                    <th>Rola</th>
                    <th>Saldo</th>
                    <th>Status</th>
                    <th>Akcja</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: "50%",
                            background: "var(--color-primary)", color: "white",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 700, fontSize: "0.65rem", overflow: "hidden", flexShrink: 0,
                          }}>
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <>{u.firstName?.[0]}{u.lastName?.[0]}</>
                            )}
                          </div>
                          {u.firstName} {u.lastName}
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td><span className="badge badge-info">{u.role === "ROLE_ADMIN" ? "Admin" : "Rodzic"}</span></td>
                      <td>{u.balance?.toFixed(2)} PLN</td>
                      <td>
                        <span className={`badge ${u.blocked ? "badge-danger" : "badge-success"}`}>
                          {u.blocked ? "Zablokowany" : "Aktywny"}
                        </span>
                      </td>
                      <td>
                        <button
                          className={`btn btn-sm ${u.blocked ? "btn-primary" : "btn-danger"}`}
                          onClick={() => toggleBlock(u.id)}
                        >
                          {u.blocked ? <><FaCheck size={11} /> Odblokuj</> : <><FaBan size={11} /> Zablokuj</>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Fundraisers Tab */}
      {tab === "fundraisers" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title"><FaDonate style={{ marginRight: 8 }} /> Wszystkie zbiórki ({filteredFundraisers.length})</div>
          </div>
          {loading ? (
            <div className="empty-state">Ładowanie...</div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tytuł</th>
                    <th>Kwota/dziecko</th>
                    <th>Saldo</th>
                    <th>Status</th>
                    <th>Blokada</th>
                    <th>Akcja</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFundraisers.map(f => (
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
                      <td>
                        <span className={`badge ${f.blocked ? "badge-danger" : "badge-success"}`}>
                          {f.blocked ? "Zablokowana" : "OK"}
                        </span>
                      </td>
                      <td>
                        <button
                          className={`btn btn-sm ${f.blocked ? "btn-primary" : "btn-danger"}`}
                          onClick={() => toggleFundraiserBlock(f.id)}
                        >
                          {f.blocked ? <><FaCheck size={11} /> Odblokuj</> : <><FaBan size={11} /> Zablokuj</>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Children Tab */}
      {tab === "children" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title"><FaUsers style={{ marginRight: 8 }} /> Wszystkie dzieci ({filteredChildren.length})</div>
          </div>
          {loading ? (
            <div className="empty-state">Ładowanie...</div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Imię i Nazwisko</th>
                    <th>Data urodzenia</th>
                    <th>ID Klasy</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChildren.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: "50%",
                            background: "var(--color-info)", color: "white",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 700, fontSize: "0.65rem", overflow: "hidden", flexShrink: 0,
                          }}>
                            {c.avatarUrl ? (
                              <img src={c.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <>{c.firstName?.[0]}{c.lastName?.[0]}</>
                            )}
                          </div>
                          {c.firstName} {c.lastName}
                        </div>
                      </td>
                      <td>{c.dateOfBirth}</td>
                      <td>{c.classId || "Brak"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Reports Tab */}
      {tab === "reports" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title"><FaFileAlt style={{ marginRight: 8 }} /> Raporty finansowe</div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end", marginBottom: 20 }}>
            <div className="form-group" style={{ marginBottom: 0, minWidth: 180 }}>
              <label className="form-label">Typ raportu</label>
              <select className="form-input" value={reportType} onChange={e => setReportType(e.target.value as any)}>
                <option value="fundraiser">Raport zbiórki</option>
                <option value="class">Raport klasy</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
              <label className="form-label">Wybierz {reportType === "fundraiser" ? "zbiórkę" : "klasę"}</label>
              <select className="form-input" value={reportId} onChange={e => setReportId(e.target.value)}>
                {reportType === "fundraiser" ? (
                  fundraisers.map(f => (
                    <option key={f.id} value={f.id}>{f.title} ({f.id})</option>
                  ))
                ) : (
                  classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                  ))
                )}
                {reportType === "fundraiser" && fundraisers.length === 0 && <option value="" disabled>Brak zbiórek</option>}
                {reportType === "class" && classes.length === 0 && <option value="" disabled>Brak klas</option>}
              </select>
            </div>
            <button className="btn btn-primary" onClick={loadReport} disabled={loading}>
              <FaSearch /> Generuj raport
            </button>
            {transactions.length > 0 && (
              <button className="btn btn-secondary" onClick={exportCSV}>
                <FaDownload /> Eksportuj CSV
              </button>
            )}
          </div>

          {transactions.length > 0 && (
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
                  {transactions.map(t => (
                    <tr key={t.id}>
                      <td>
                        <span className={`badge ${
                          t.type === "PAYMENT_FOR_CHILD" ? "badge-success" :
                          t.type === "WITHDRAWAL" || t.type === "EXTERNAL_WITHDRAWAL" ? "badge-danger" : "badge-info"
                        }`}>{t.type}</span>
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

          {transactions.length === 0 && !loading && (
            <div className="empty-state">
              <FaFileAlt style={{ fontSize: "2rem", opacity: 0.3 }} />
              <p>Wygeneruj raport powyżej</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
