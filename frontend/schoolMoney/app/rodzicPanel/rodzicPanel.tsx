import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { redirect } from "react-router";
import { api } from "../utils/serviceAPI";
import type { Child } from "../utils/serviceAPI";
import ImageUpload from "../utils/ImageUpload";
import {
  FaUserFriends,
  FaPlusCircle,
  FaChild,
  FaTimes,
  FaLink,
  FaUser,
  FaBirthdayCake,
  FaSchool,
  FaEdit,
  FaTrashAlt,
  FaExclamationTriangle,
} from "react-icons/fa";

export async function clientLoader() {
  if (!api.isAuthenticated()) throw redirect("/");
  return {};
}

export default function RodzicPanel() {
  const [user, setUser] = useState(api.getUser());
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddChild, setShowAddChild] = useState(false);
  const [showJoinClass, setShowJoinClass] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);

  // Add child form
  const [childForm, setChildForm] = useState({
    firstName: "", lastName: "", avatarUrl: "", dateOfBirth: "",
  });
  const [addLoading, setAddLoading] = useState(false);

  // Edit profile state
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: "", lastName: "", avatarUrl: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Edit child state
  const [showEditChild, setShowEditChild] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [editChildForm, setEditChildForm] = useState({
    firstName: "", lastName: "", avatarUrl: "",
  });
  const [editChildLoading, setEditChildLoading] = useState(false);

  // Delete child state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingChild, setDeletingChild] = useState<Child | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { loadChildren(); }, []);

  async function loadChildren() {
    try {
      setLoading(true);
      const ch = await api.getMyChildren();
      setChildren(ch);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleAddChild(e: React.FormEvent) {
    e.preventDefault();
    try {
      setAddLoading(true);
      await api.addChild({
        firstName: childForm.firstName,
        lastName: childForm.lastName,
        avatarUrl: childForm.avatarUrl || undefined,
        dateOfBirth: childForm.dateOfBirth,
      });
      setChildForm({ firstName: "", lastName: "", avatarUrl: "", dateOfBirth: "" });
      setShowAddChild(false);
      await loadChildren();
      flash("success", "Dziecko dodane pomyślnie!");
    } catch (e: any) {
      flash("error", e?.message || "Błąd dodawania dziecka");
    } finally { setAddLoading(false); }
  }

  async function handleJoinClass(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedChildId || !inviteToken.trim()) return;
    try {
      await api.assignChildToClass(selectedChildId, inviteToken.trim());
      setShowJoinClass(false);
      setInviteToken("");
      setSelectedChildId("");
      await loadChildren();
      flash("success", "Dziecko dołączyło do klasy pomyślnie!");
    } catch (e: any) {
      flash("error", e?.message || "Błąd dołączania do klasy (nieprawidłowy token?)");
    }
  }

  async function handleLeaveClass(child: Child) {
    if (!confirm(`Czy na pewno chcesz wypisać dziecko ${child.firstName} z obecnej klasy?`)) return;
    try {
      await api.leaveClass(child.id);
      await loadChildren();
      flash("success", "Dziecko zostało wypisane z klasy.");
    } catch (e: any) {
      flash("error", e?.message || "Błąd wypisywania z klasy");
    }
  }

  // ── Edit Profile ──
  function openEditProfile() {
    setProfileForm({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      avatarUrl: "",
    });
    setShowEditProfile(true);
  }

  async function handleEditProfile(e: React.FormEvent) {
    e.preventDefault();
    try {
      setProfileLoading(true);
      const updated = await api.updateProfile({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        avatarUrl: profileForm.avatarUrl || undefined,
      });
      setUser(updated);
      setShowEditProfile(false);
      flash("success", "Profil zaktualizowany!");
    } catch (e: any) {
      flash("error", e?.message || "Błąd aktualizacji profilu");
    } finally { setProfileLoading(false); }
  }

  // ── Edit Child ──
  function openEditChild(child: Child) {
    setEditingChild(child);
    setEditChildForm({
      firstName: child.firstName,
      lastName: child.lastName,
      avatarUrl: child.avatarUrl || "",
    });
    setShowEditChild(true);
  }

  async function handleEditChild(e: React.FormEvent) {
    e.preventDefault();
    if (!editingChild) return;
    try {
      setEditChildLoading(true);
      await api.updateChild(editingChild.id, {
        firstName: editChildForm.firstName,
        lastName: editChildForm.lastName,
        avatarUrl: editChildForm.avatarUrl || undefined,
      });
      setShowEditChild(false);
      setEditingChild(null);
      await loadChildren();
      flash("success", "Dane dziecka zaktualizowane!");
    } catch (e: any) {
      flash("error", e?.message || "Błąd aktualizacji dziecka");
    } finally { setEditChildLoading(false); }
  }

  // ── Delete Child ──
  function openDeleteConfirm(child: Child) {
    setDeletingChild(child);
    setShowDeleteConfirm(true);
  }

  async function handleDeleteChild() {
    if (!deletingChild) return;
    try {
      setDeleteLoading(true);
      await api.deleteChild(deletingChild.id);
      setShowDeleteConfirm(false);
      setDeletingChild(null);
      await loadChildren();
      flash("success", "Dziecko usunięte z systemu.");
    } catch (e: any) {
      flash("error", e?.message || "Błąd usuwania dziecka");
    } finally { setDeleteLoading(false); }
  }

  function flash(type: string, text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
            <FaUserFriends style={{ marginRight: 10, color: "var(--color-primary)" }} />
            Panel Rodzica
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: 4, fontSize: "0.9rem" }}>
            Zarządzaj swoimi dziećmi i przypisuj je do klas
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-outline" onClick={() => setShowJoinClass(true)}>
            <FaLink /> Dołącz do klasy
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddChild(true)}>
            <FaPlusCircle /> Dodaj dziecko
          </button>
        </div>
      </div>

      {msg && <div className={`alert ${msg.type === "success" ? "alert-success" : "alert-error"}`}>{msg.text}</div>}

      {/* Profile Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="card-title">
            <FaUser style={{ marginRight: 8, color: "var(--color-primary)" }} />
            Profil Rodzica
          </div>
          <button
            className="btn btn-outline"
            style={{ fontSize: "0.8rem", padding: "6px 14px" }}
            onClick={openEditProfile}
          >
            <FaEdit style={{ marginRight: 4 }} /> Edytuj profil
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 4 }}>Imię i Nazwisko</div>
            <div style={{ fontWeight: 600 }}>{user?.firstName} {user?.lastName}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 4 }}>E-mail</div>
            <div style={{ fontWeight: 600 }}>{user?.email}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 4 }}>Rola</div>
            <span className="badge badge-warning">
              {user?.role === "ROLE_ADMIN" ? "Administrator" : "Rodzic"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Edit Profile Modal ── */}
      {showEditProfile && createPortal(
        <div className="modal-overlay" onClick={() => setShowEditProfile(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 className="modal-title" style={{ margin: 0 }}>
                <FaEdit style={{ marginRight: 8, color: "var(--color-primary)" }} />
                Edytuj profil
              </h2>
              <button className="btn btn-icon btn-secondary" onClick={() => setShowEditProfile(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleEditProfile}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Imię *</label>
                  <input className="form-input" required value={profileForm.firstName} onChange={e => setProfileForm({...profileForm, firstName: e.target.value})} placeholder="Twoje imię" />
                </div>
                <div className="form-group">
                  <label className="form-label">Nazwisko *</label>
                  <input className="form-input" required value={profileForm.lastName} onChange={e => setProfileForm({...profileForm, lastName: e.target.value})} placeholder="Twoje nazwisko" />
                </div>
              </div>
              <ImageUpload
                label="Avatar (opcjonalnie)"
                currentUrl={profileForm.avatarUrl || undefined}
                onUploaded={(url) => setProfileForm({...profileForm, avatarUrl: url})}
              />
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditProfile(false)}>Anuluj</button>
                <button type="submit" className="btn btn-primary" disabled={profileLoading}>
                  {profileLoading ? "Zapisywanie..." : "Zapisz zmiany"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Add Child Modal */}
      {showAddChild && createPortal(
        <div className="modal-overlay" onClick={() => setShowAddChild(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 className="modal-title" style={{ margin: 0 }}>Dodaj dziecko</h2>
              <button className="btn btn-icon btn-secondary" onClick={() => setShowAddChild(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleAddChild}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Imię *</label>
                  <input className="form-input" required value={childForm.firstName} onChange={e => setChildForm({...childForm, firstName: e.target.value})} placeholder="Imię dziecka" />
                </div>
                <div className="form-group">
                  <label className="form-label">Nazwisko *</label>
                  <input className="form-input" required value={childForm.lastName} onChange={e => setChildForm({...childForm, lastName: e.target.value})} placeholder="Nazwisko dziecka" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Data urodzenia *</label>
                <input 
                  type="date" 
                  className="form-input" 
                  required 
                  max={new Date().toISOString().split('T')[0]}
                  value={childForm.dateOfBirth} 
                  onChange={e => setChildForm({...childForm, dateOfBirth: e.target.value})} 
                />
              </div>
              <ImageUpload
                label="Avatar (opcjonalnie)"
                currentUrl={childForm.avatarUrl || undefined}
                onUploaded={(url) => setChildForm({...childForm, avatarUrl: url})}
              />
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddChild(false)}>Anuluj</button>
                <button type="submit" className="btn btn-primary" disabled={addLoading}>
                  {addLoading ? "Dodawanie..." : "Dodaj dziecko"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Join Class Modal */}
      {showJoinClass && createPortal(
        <div className="modal-overlay" onClick={() => setShowJoinClass(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 className="modal-title" style={{ margin: 0 }}>Dołącz do klasy</h2>
              <button className="btn btn-icon btn-secondary" onClick={() => setShowJoinClass(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleJoinClass}>
              <div className="form-group">
                <label className="form-label">Wybierz dziecko *</label>
                <select className="form-input" required value={selectedChildId} onChange={e => setSelectedChildId(e.target.value)}>
                  <option value="">-- wybierz --</option>
                  {children.filter(c => !c.classId).map(c => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Token zaproszeniowy *</label>
                <input className="form-input" required value={inviteToken} onChange={e => setInviteToken(e.target.value)} placeholder="Wklej token od Skarbnika" />
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 16 }}>
                Poproś Skarbnika klasy o token zaproszeniowy, a następnie wklej go tutaj.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowJoinClass(false)}>Anuluj</button>
                <button type="submit" className="btn btn-primary">Dołącz</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── Edit Child Modal ── */}
      {showEditChild && editingChild && createPortal(
        <div className="modal-overlay" onClick={() => { setShowEditChild(false); setEditingChild(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 className="modal-title" style={{ margin: 0 }}>
                <FaEdit style={{ marginRight: 8, color: "var(--color-primary)" }} />
                Edytuj dziecko
              </h2>
              <button className="btn btn-icon btn-secondary" onClick={() => { setShowEditChild(false); setEditingChild(null); }}><FaTimes /></button>
            </div>
            <form onSubmit={handleEditChild}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Imię *</label>
                  <input className="form-input" required value={editChildForm.firstName} onChange={e => setEditChildForm({...editChildForm, firstName: e.target.value})} placeholder="Imię dziecka" />
                </div>
                <div className="form-group">
                  <label className="form-label">Nazwisko *</label>
                  <input className="form-input" required value={editChildForm.lastName} onChange={e => setEditChildForm({...editChildForm, lastName: e.target.value})} placeholder="Nazwisko dziecka" />
                </div>
              </div>
              <ImageUpload
                label="Avatar (opcjonalnie)"
                currentUrl={editChildForm.avatarUrl || undefined}
                onUploaded={(url) => setEditChildForm({...editChildForm, avatarUrl: url})}
              />
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowEditChild(false); setEditingChild(null); }}>Anuluj</button>
                <button type="submit" className="btn btn-primary" disabled={editChildLoading}>
                  {editChildLoading ? "Zapisywanie..." : "Zapisz zmiany"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── Delete Confirm Modal ── */}
      {showDeleteConfirm && deletingChild && createPortal(
        <div className="modal-overlay" onClick={() => { setShowDeleteConfirm(false); setDeletingChild(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
              <FaExclamationTriangle style={{ fontSize: "2.5rem", color: "#e74c3c", marginBottom: 12 }} />
              <h2 className="modal-title" style={{ margin: "0 0 8px", fontSize: "1.2rem" }}>Potwierdź usunięcie</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: "0 0 20px", lineHeight: 1.5 }}>
                Czy na pewno chcesz usunąć <strong>{deletingChild.firstName} {deletingChild.lastName}</strong> z systemu?
                <br />
                <span style={{ color: "#e74c3c", fontWeight: 600 }}>Tej operacji nie można cofnąć.</span>
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button className="btn btn-secondary" onClick={() => { setShowDeleteConfirm(false); setDeletingChild(null); }}>
                  Anuluj
                </button>
                <button
                  className="btn"
                  style={{
                    background: "linear-gradient(135deg, #e74c3c, #c0392b)",
                    color: "white",
                    border: "none",
                  }}
                  onClick={handleDeleteChild}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? "Usuwanie..." : "Tak, usuń"}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Children List */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <FaChild style={{ marginRight: 8, color: "var(--color-primary)" }} />
            Twoje dzieci ({children.length})
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Ładowanie...</div>
        ) : children.length === 0 ? (
          <div className="empty-state">
            <FaChild style={{ fontSize: "3rem", opacity: 0.3, color: "var(--color-primary)" }} />
            <p style={{ fontSize: "1rem", marginTop: 12 }}>Nie dodałeś jeszcze żadnych dzieci</p>
            <button className="btn btn-primary" onClick={() => setShowAddChild(true)}>
              <FaPlusCircle /> Dodaj pierwsze dziecko
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {children.map((child, i) => (
              <div
                key={child.id}
                className="animate-fade-in"
                style={{
                  animationDelay: `${i * 0.05}s`,
                  padding: 16,
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-cream-light)",
                  border: "1px solid #f0e6d4",
                  display: "flex",
                  gap: 14,
                  alignItems: "center",
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontWeight: 700, fontSize: "1rem",
                  flexShrink: 0, overflow: "hidden",
                }}>
                  {child.avatarUrl ? (
                    <img src={child.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <>{child.firstName[0]}{child.lastName[0]}</>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{child.firstName} {child.lastName}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4 }}>
                    <FaBirthdayCake size={11} /> {child.dateOfBirth}
                  </div>
                  <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    {child.classId ? (
                      <>
                        <span className="badge badge-success"><FaSchool size={10} style={{ marginRight: 4 }} /> Przypisane do klasy</span>
                        <button
                          className="btn btn-outline"
                          style={{ fontSize: "0.7rem", padding: "2px 8px", color: "var(--color-danger)", borderColor: "var(--color-danger)" }}
                          onClick={() => handleLeaveClass(child)}
                        >
                          Wypisz z klasy
                        </button>
                      </>
                    ) : (
                      <span className="badge badge-warning">Brak klasy</span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                  <button
                    className="btn btn-outline"
                    style={{ fontSize: "0.75rem", padding: "5px 10px" }}
                    onClick={() => openEditChild(child)}
                    title="Edytuj dziecko"
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="btn"
                    style={{
                      fontSize: "0.75rem",
                      padding: "5px 10px",
                      background: "rgba(231, 76, 60, 0.1)",
                      color: "#e74c3c",
                      border: "1px solid rgba(231, 76, 60, 0.3)",
                      borderRadius: "var(--radius-sm, 6px)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onClick={() => openDeleteConfirm(child)}
                    title="Usuń dziecko"
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(231, 76, 60, 0.2)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "#e74c3c";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(231, 76, 60, 0.1)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(231, 76, 60, 0.3)";
                    }}
                  >
                    <FaTrashAlt />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
