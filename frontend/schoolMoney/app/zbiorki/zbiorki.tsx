import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { redirect } from "react-router";
import { api } from "../utils/serviceAPI";
import type { SchoolClass, Fundraiser, Child, Transaction, UserSummary } from "../utils/serviceAPI";
import ImageUpload from "../utils/ImageUpload";
import {
  FaDonate,
  FaPlusCircle,
  FaTimes,
  FaMoneyBillWave,
  FaChild,
  FaReceipt,
  FaLock,
  FaEye,
  FaArrowDown,
  FaExternalLinkAlt,
  FaHistory,
} from "react-icons/fa";

export async function clientLoader() {
  if (!api.isAuthenticated()) throw redirect("/");
  return {};
}

export default function Zbiorki() {
  const user = api.getUser();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<Fundraiser | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);

  // Create form
  const [form, setForm] = useState({
    title: "", description: "", logoUrl: "", startDate: "", endDate: "", amountPerChild: "",
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Withdraw
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawExternal, setWithdrawExternal] = useState(false);

  // Receipt
  const [receiptUrl, setReceiptUrl] = useState("");

  const [classChildren, setClassChildren] = useState<Child[]>([]);
  const [allUsers, setAllUsers] = useState<UserSummary[]>([]);

  useEffect(() => { loadClasses(); }, []);
  useEffect(() => { 
    if (selectedClassId) {
      loadFundraisers();
      loadClassChildren();
    }
  }, [selectedClassId]);

  async function loadClassChildren() {
    try {
      const ch = await api.getClassChildren(selectedClassId);
      setClassChildren(ch);
    } catch (e) {
      console.error("Failed to load class children", e);
      setClassChildren(children.filter(c => c.classId === selectedClassId));
    }
  }

  async function loadClasses() {
    try {
      const [cls, ch, users] = await Promise.all([api.getMyClasses(), api.getMyChildren(), api.getUsers()]);
      setClasses(cls);
      setChildren(ch);
      setAllUsers(users);
      if (cls.length > 0) setSelectedClassId(cls[0].id);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function loadFundraisers() {
    try {
      const frs = await api.getClassFundraisers(selectedClassId);
      setFundraisers(frs);
    } catch (e) { console.error(e); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (form.endDate < form.startDate) {
      flash("error", "Data końca nie może być wcześniejsza niż data startu");
      return;
    }
    try {
      setCreateLoading(true);
      await api.createFundraiser({
        classId: selectedClassId,
        title: form.title,
        description: form.description,
        logoUrl: form.logoUrl || undefined,
        startDate: form.startDate,
        endDate: form.endDate,
        amountPerChild: parseFloat(form.amountPerChild),
      });
      setShowCreate(false);
      setForm({ title: "", description: "", logoUrl: "", startDate: "", endDate: "", amountPerChild: "" });
      await loadFundraisers();
      flash("success", "Zbiórka utworzona pomyślnie!");
    } catch (e: any) {
      flash("error", e?.message || "Błąd tworzenia zbiórki");
    } finally { setCreateLoading(false); }
  }

  async function openDetail(f: Fundraiser) {
    setShowDetail(f);
    try {
      const txs = await api.getFundraiserTransactions(f.id);
      setTransactions(txs);
    } catch (e) { console.error(e); }
  }

  async function handlePay(childId: string) {
    if (!showDetail) return;
    try {
      await api.payForChild(showDetail.id, childId);
      flash("success", "Płatność zrealizowana!");
      await loadFundraisers();
      const txs = await api.getFundraiserTransactions(showDetail.id);
      setTransactions(txs);
      const frs = await api.getClassFundraisers(selectedClassId);
      const updated = frs.find(f => f.id === showDetail.id);
      if (updated) setShowDetail(updated);
    } catch (e: any) { 
      if (e?.message === "Insufficient funds") {
        flash("error", "Brak wystarczających środków na koncie");
      } else {
        flash("error", e?.message || "Błąd płatności"); 
      }
    }
  }

  async function handleRefundPayment(childId: string) {
    if (!showDetail) return;
    if (!confirm("Czy na pewno chcesz wycofać tę wpłatę? Środki wrócą na Twoje konto.")) return;
    try {
      await api.refundPayment(showDetail.id, childId);
      flash("success", "Wpłata została wycofana!");
      await loadFundraisers();
      const txs = await api.getFundraiserTransactions(showDetail.id);
      setTransactions(txs);
      const frs = await api.getClassFundraisers(selectedClassId);
      const updated = frs.find(f => f.id === showDetail.id);
      if (updated) setShowDetail(updated);
    } catch (e: any) {
      flash("error", e?.message || "Błąd wycofywania wpłaty");
    }
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    if (!showDetail) return;
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      flash("error", "Wprowadź poprawną kwotę");
      return;
    }
    if (amount > (showDetail.balance || 0)) {
      flash("error", "Kwota wypłaty nie może przekraczać aktualnego salda zbiórki");
      return;
    }
    try {
      await api.withdraw(showDetail.id, amount, withdrawExternal);
      flash("success", `Wypłata ${amount.toFixed(2)} PLN zrealizowana!`);
      setWithdrawAmount("");
      await loadFundraisers();
      const frs = await api.getClassFundraisers(selectedClassId);
      const updated = frs.find(f => f.id === showDetail.id);
      if (updated) setShowDetail(updated);
    } catch (e: any) { flash("error", e?.message || "Błąd wypłaty"); }
  }

  async function handleAddReceipt(e: React.FormEvent) {
    e.preventDefault();
    if (!showDetail || !receiptUrl.trim()) return;
    try {
      const updated = await api.addReceipt(showDetail.id, receiptUrl.trim());
      setShowDetail(updated);
      setReceiptUrl("");
      flash("success", "Paragon dodany!");
    } catch (e: any) { flash("error", e?.message || "Błąd dodawania paragonu"); }
  }

  async function handleClose() {
    if (!showDetail) return;
    if (showDetail.balance && showDetail.balance > 0) {
      if (!confirm(`Zbiórka posiada saldo w wysokości ${showDetail.balance.toFixed(2)} PLN. Po zamknięciu, kwota ta zostanie automatycznie i po równo rozdzielona jako zwrot dla wszystkich osób, które dokonały wpłaty na tę zbiórkę. Czy kontynuować?`)) return;
    } else {
      if (!confirm("Czy na pewno chcesz zamknąć tę zbiórkę?")) return;
    }
    try {
      const updated = await api.closeFundraiser(showDetail.id);
      setShowDetail(updated);
      flash("success", "Zbiórka zamknięta. Środki (jeśli były) zostały zwrócone na konta rodziców.");
      await loadFundraisers();
    } catch (e: any) { flash("error", e?.message || "Błąd zamykania zbiórki"); }
  }

  function flash(type: string, text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  }

  const currentClass = classes.find(c => c.id === selectedClassId);
  const isClassTreasurer = currentClass?.treasurerId === user?.id;
  const isCreator = showDetail?.creatorId === user?.id || isClassTreasurer;

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
            <FaDonate style={{ marginRight: 10, color: "var(--color-primary)" }} />
            Zbiórki
          </h1>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <select
            className="form-input"
            style={{ width: "auto", padding: "8px 16px", borderRadius: "var(--radius-pill)" }}
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)} disabled={!selectedClassId}>
            <FaPlusCircle /> Nowa zbiórka
          </button>
        </div>
      </div>

      {msg && <div className={`alert ${msg.type === "success" ? "alert-success" : "alert-error"}`}>{msg.text}</div>}

      {/* Create Modal */}
      {showCreate && createPortal(
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 className="modal-title" style={{ margin: 0 }}>Nowa zbiórka</h2>
              <button className="btn btn-icon btn-secondary" onClick={() => setShowCreate(false)}><FaTimes /></button>
            </div>
            {msg && <div className={`alert ${msg.type === "success" ? "alert-success" : "alert-error"}`} style={{ marginBottom: 16 }}>{msg.text}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Tytuł *</label>
                <input className="form-input" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Cel zbiórki" />
              </div>
              <div className="form-group">
                <label className="form-label">Opis</label>
                <input className="form-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Krótki opis" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Data startu *</label>
                  <input type="date" className="form-input" required min={new Date().toISOString().split('T')[0]} value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Data końca *</label>
                  <input type="date" className="form-input" required min={form.startDate || new Date().toISOString().split('T')[0]} value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Kwota od każdego rodzica za dziecko (PLN) *</label>
                <input type="number" step="0.01" min="0.01" className="form-input" required value={form.amountPerChild} onChange={e => setForm({...form, amountPerChild: e.target.value})} placeholder="0.00" />
              </div>
              <ImageUpload
                label="Logo zbiórki (opcjonalnie)"
                currentUrl={form.logoUrl || undefined}
                onUploaded={(url) => setForm({...form, logoUrl: url})}
              />
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Anuluj</button>
                <button type="submit" className="btn btn-primary" disabled={createLoading}>
                  {createLoading ? "Tworzenie..." : "Utwórz zbiórkę"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Detail Modal */}
      {showDetail && createPortal(
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640, maxHeight: "90vh", overflow: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {showDetail.logoUrl && (
                  <img
                    src={showDetail.logoUrl}
                    alt="Logo zbiórki"
                    style={{
                      width: 48, height: 48, borderRadius: 12,
                      objectFit: "cover",
                      border: "2px solid #f0e6d4",
                    }}
                  />
                )}
                <h2 className="modal-title" style={{ margin: 0 }}>{showDetail.title}</h2>
              </div>
              <button className="btn btn-icon btn-secondary" onClick={() => setShowDetail(null)}><FaTimes /></button>
            </div>

            {msg && <div className={`alert ${msg.type === "success" ? "alert-success" : "alert-error"}`} style={{ marginBottom: 16 }}>{msg.text}</div>}

            {showDetail.description && (
              <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>{showDetail.description}</p>
            )}

            <div className="stats-grid" style={{ marginBottom: 20 }}>
              <div className="stat-card">
                <div className="stat-label">Saldo zbiórki</div>
                <div className="stat-value">{showDetail.balance?.toFixed(2)} PLN</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Kwota/dziecko</div>
                <div className="stat-value" style={{ color: "var(--color-info)" }}>{showDetail.amountPerChild?.toFixed(2)} PLN</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <span className={`badge ${showDetail.status === "ACTIVE" ? "badge-success" : "badge-danger"}`}>
                {showDetail.status === "ACTIVE" ? "Aktywna" : "Zamknięta"}
              </span>
              <span className="badge badge-info">{showDetail.startDate} → {showDetail.endDate}</span>
            </div>

            {/* Pay for child */}
            {showDetail.status === "ACTIVE" && classChildren.length > 0 && (
              <div style={{ marginBottom: 20, padding: 16, background: "var(--color-cream-light)", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: "0.9rem" }}>
                  <FaChild style={{ marginRight: 6 }} /> Zapłać za dziecko
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {classChildren.map(child => {
                    const paymentTx = transactions.find(t => t.childId === child.id && t.type === "PAYMENT_FOR_CHILD");
                    const isRefunded = transactions.some(t => t.childId === child.id && t.type === "REFUND");
                    const paid = paymentTx && !isRefunded;
                    const canRefund = paid && (paymentTx as any).payerId === user?.id && showDetail.status === "ACTIVE";

                    return (
                      <div key={child.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "white", borderRadius: "var(--radius-sm)" }}>
                        <span style={{ fontSize: "0.9rem" }}>{child.firstName} {child.lastName}</span>
                        {paid ? (
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <span className="badge badge-success">Opłacone ✓</span>
                            {canRefund && (
                              <button className="btn btn-outline" style={{ fontSize: "0.7rem", padding: "2px 8px", color: "var(--color-danger)", borderColor: "var(--color-danger)" }} onClick={() => handleRefundPayment(child.id)}>
                                Wycofaj wpłatę
                              </button>
                            )}
                          </div>
                        ) : (
                          <button className="btn btn-primary btn-sm" onClick={() => handlePay(child.id)} disabled={showDetail.status === "CLOSED"}>
                            <FaMoneyBillWave size={12} /> Zapłać {showDetail.amountPerChild?.toFixed(2)} PLN
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Withdraw (creator only) */}
            {isCreator && (
              <div style={{ marginBottom: 20, padding: 16, background: "var(--color-cream-light)", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: "0.9rem" }}>
                  <FaArrowDown style={{ marginRight: 6 }} /> Wypłata ze zbiórki
                </div>
                <form onSubmit={handleWithdraw} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", gap: 10 }}>
                    <input type="number" step="0.01" min="0.01" max={showDetail.balance} required className="form-input" placeholder={`Max ${showDetail.balance?.toFixed(2)} PLN`} value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} style={{ flex: 1 }} />
                    <button type="submit" className="btn btn-primary btn-sm">Wypłać</button>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    <input type="checkbox" checked={withdrawExternal} onChange={e => setWithdrawExternal(e.target.checked)} />
                    <FaExternalLinkAlt size={12} /> Przelew zewnętrzny (pieniądze opuszczają system)
                  </label>
                </form>
              </div>
            )}

            {/* Add Receipt (creator only) */}
            {isCreator && (
              <div style={{ marginBottom: 20, padding: 16, background: "var(--color-cream-light)", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: "0.9rem" }}>
                  <FaReceipt style={{ marginRight: 6 }} /> Paragony / Faktury
                </div>
                {showDetail.receiptUrls?.length > 0 && (
                  <div style={{ marginBottom: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                    {showDetail.receiptUrls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer" style={{ fontSize: "0.85rem", color: "var(--color-info)" }}>
                        📄 Dokument {i + 1}
                      </a>
                    ))}
                  </div>
                )}
                <form onSubmit={handleAddReceipt} style={{ display: "flex", gap: 10 }}>
                  <input className="form-input" placeholder="URL paragonu/faktury" value={receiptUrl} onChange={e => setReceiptUrl(e.target.value)} style={{ flex: 1 }} />
                  <button type="submit" className="btn btn-secondary btn-sm">Dodaj</button>
                </form>
              </div>
            )}

            {/* Close Fundraiser */}
            {isCreator && showDetail.status === "ACTIVE" && (
              <button className="btn btn-danger" style={{ width: "100%", marginBottom: 20 }} onClick={handleClose}>
                <FaLock /> Zamknij zbiórkę
              </button>
            )}

            {/* Transactions */}
            <div style={{ fontWeight: 600, marginBottom: 10, fontSize: "0.9rem" }}>
              <FaHistory style={{ marginRight: 6 }} /> Historia transakcji ({transactions.length})
            </div>
            {transactions.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Brak transakcji</p>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Typ</th>
                      <th>Kwota</th>
                      <th>Kto</th>
                      <th>Za kogo</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(t => {
                      const payer = allUsers.find(u => u.id === (t as any).payerId);
                      const payerName = payer ? `${payer.firstName} ${payer.lastName}` : "Nieznany";
                      
                      let childName = "-";
                      if (t.type === "PAYMENT_FOR_CHILD" && t.childId) {
                        const child = classChildren.find(c => c.id === t.childId) || children.find(c => c.id === t.childId);
                        childName = child ? `${child.firstName} ${child.lastName}` : "Inne dziecko";
                      }

                      return (
                        <tr key={t.id}>
                          <td>
                            <span className={`badge ${t.type === "PAYMENT_FOR_CHILD" ? "badge-success" : t.type === "WITHDRAWAL" || t.type === "EXTERNAL_WITHDRAWAL" ? "badge-danger" : "badge-info"}`}>
                              {t.type === "PAYMENT_FOR_CHILD" ? "Wpłata" : t.type === "WITHDRAWAL" ? "Wypłata" : t.type === "EXTERNAL_WITHDRAWAL" ? "Przelew zew." : t.type}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{t.amount?.toFixed(2)} PLN</td>
                          <td>{payerName}</td>
                          <td>{childName}</td>
                          <td>{new Date(t.timestamp).toLocaleString("pl-PL")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Fundraiser Cards */}
      {loading ? (
        <div className="empty-state">Ładowanie...</div>
      ) : classes.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <FaDonate style={{ fontSize: "3rem", opacity: 0.3 }} />
            <p>Nie masz żadnych klas. Utwórz klasę, aby móc zarządzać zbiórkami.</p>
          </div>
        </div>
      ) : fundraisers.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <FaDonate style={{ fontSize: "3rem", opacity: 0.3, color: "var(--color-primary)" }} />
            <p style={{ fontSize: "1rem", marginTop: 12 }}>Brak zbiórek w tej klasie</p>
            <p style={{ fontSize: "0.85rem" }}>Utwórz pierwszą zbiórkę</p>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
          {fundraisers.map((f, i) => (
            <div
              key={f.id}
              className="card animate-fade-in"
              style={{ animationDelay: `${i * 0.05}s`, cursor: "pointer", position: "relative" }}
              onClick={() => openDetail(f)}
            >
              {f.blocked && (
                <span className="badge badge-danger" style={{ position: "absolute", top: 12, right: 12 }}>Zablokowana</span>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: f.status === "ACTIVE" ? "linear-gradient(135deg, #2F855A, #38A169)" : "linear-gradient(135deg, #718096, #A0AEC0)",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "white",
                  overflow: "hidden", flexShrink: 0,
                }}>
                  {f.logoUrl ? (
                    <img src={f.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <FaDonate size={20} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{f.title}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{f.startDate} → {f.endDate}</div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Zebrano</div>
                  <div style={{ fontWeight: 700, color: "var(--color-success)" }}>{f.balance?.toFixed(2)} PLN</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Kwota/dziecko</div>
                  <div style={{ fontWeight: 600 }}>{f.amountPerChild?.toFixed(2)} PLN</div>
                </div>
                <span className={`badge ${f.status === "ACTIVE" ? "badge-success" : "badge-danger"}`}>
                  {f.status === "ACTIVE" ? "Aktywna" : "Zamknięta"}
                </span>
              </div>
              <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--color-primary)", display: "flex", alignItems: "center", gap: 4 }}>
                  <FaEye size={12} /> Szczegóły
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
