import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { redirect } from "react-router";
import { api } from "../utils/serviceAPI";
import type { SchoolClass, Child } from "../utils/serviceAPI";
import {
  FaSchool,
  FaPlusCircle,
  FaCopy,
  FaCheck,
  FaChild,
  FaLink,
  FaTimes,
  FaUserTie,
} from "react-icons/fa";

export async function clientLoader() {
  if (!api.isAuthenticated()) throw redirect("/");
  return {};
}

export default function Klasa() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);
  const [classChildren, setClassChildren] = useState<Child[]>([]);
  const user = api.getUser();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [cls, ch] = await Promise.all([api.getMyClasses(), api.getMyChildren()]);
      setClasses(cls);
      setChildren(ch);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newClassName.trim()) return;
    try {
      setCreateLoading(true);
      setCreateError("");
      await api.createClass({ name: newClassName.trim() });
      setNewClassName("");
      setShowCreate(false);
      await loadData();
    } catch (e: any) {
      setCreateError(e?.message || "Błąd tworzenia klasy");
    } finally {
      setCreateLoading(false);
    }
  }

  function copyToken(token: string) {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  function viewClassChildren(cls: SchoolClass) {
    const filtered = children.filter((c) => c.classId === cls.id);
    setClassChildren(filtered);
    setSelectedClass(cls);
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
            <FaSchool style={{ marginRight: 10, color: "var(--color-primary)" }} />
            Moje Klasy
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: 4, fontSize: "0.9rem" }}>
            Zarządzaj klasami szkolnymi i tokenami zaproszeniowymi
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <FaPlusCircle /> Nowa klasa
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && createPortal(
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 className="modal-title" style={{ margin: 0 }}>Utwórz nową klasę</h2>
              <button className="btn btn-icon btn-secondary" onClick={() => setShowCreate(false)}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              {createError && <div className="alert alert-error">{createError}</div>}
              <div className="form-group">
                <label className="form-label">Nazwa klasy (unikalna) *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="np. Klasa 3A - Rocznik 2023"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  required
                />
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 16 }}>
                Po utworzeniu klasy stajesz się jej Skarbnikiem. Otrzymasz token zaproszeniowy do udostępnienia rodzicom.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                  Anuluj
                </button>
                <button type="submit" className="btn btn-primary" disabled={createLoading}>
                  {createLoading ? "Tworzenie..." : "Utwórz klasę"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Children Detail Modal */}
      {selectedClass && createPortal(
        <div className="modal-overlay" onClick={() => setSelectedClass(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 className="modal-title" style={{ margin: 0 }}>
                Dzieci w klasie: {selectedClass.name}
              </h2>
              <button className="btn btn-icon btn-secondary" onClick={() => setSelectedClass(null)}>
                <FaTimes />
              </button>
            </div>
            {classChildren.length === 0 ? (
              <div className="empty-state">
                <FaChild style={{ fontSize: "2rem", opacity: 0.3 }} />
                <p>Brak dzieci w tej klasie</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {classChildren.map((child) => (
                  <div
                    key={child.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 16px",
                      background: "var(--color-cream-light)",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "var(--color-primary)",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "0.8rem",
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      {child.avatarUrl ? (
                        <img src={child.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <>{child.firstName[0]}{child.lastName[0]}</>
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{child.firstName} {child.lastName}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        Ur. {child.dateOfBirth}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Classes List */}
      {loading ? (
        <div className="empty-state">Ładowanie...</div>
      ) : classes.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <FaSchool style={{ fontSize: "3rem", opacity: 0.3, color: "var(--color-primary)" }} />
            <p style={{ fontSize: "1rem", marginTop: 12 }}>Nie masz jeszcze żadnych klas</p>
            <p style={{ fontSize: "0.85rem" }}>Utwórz klasę, aby stać się jej Skarbnikiem</p>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
          {classes.map((cls, i) => (
            <div
              key={cls.id}
              className="card animate-fade-in"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                  }}
                >
                  <FaSchool size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text-primary)" }}>
                    {cls.name}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {cls.treasurerId === user?.id ? (
                      <><FaUserTie size={11} style={{ color: "var(--color-primary)" }} /> Jesteś Skarbnikiem</>
                    ) : (
                      <><FaChild size={11} /> Rodzic w klasie</>
                    )}
                  </div>
                </div>
              </div>

              {/* Invite Token (only for treasurer) */}
              {cls.treasurerId === user?.id && (
                <div
                  style={{
                    background: "var(--color-cream-light)",
                    borderRadius: "var(--radius-md)",
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 14,
                  }}
                >
                  <FaLink size={13} style={{ color: "var(--color-accent)", flexShrink: 0 }} />
                  <code
                    style={{
                      flex: 1,
                      fontSize: "0.75rem",
                      color: "var(--text-secondary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {cls.inviteToken}
                  </code>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => copyToken(cls.inviteToken)}
                    style={{ flexShrink: 0, padding: "4px 10px" }}
                  >
                    {copiedToken === cls.inviteToken ? (
                      <><FaCheck style={{ color: "var(--color-success)" }} /> Skopiowano</>
                    ) : (
                      <><FaCopy /> Kopiuj</>
                    )}
                  </button>
                </div>
              )}

              <button
                className="btn btn-outline btn-sm"
                style={{ width: "100%" }}
                onClick={() => viewClassChildren(cls)}
              >
                <FaChild size={13} /> Pokaż dzieci w klasie
              </button>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(auto-fill"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
