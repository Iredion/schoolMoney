import { useState, useEffect, useRef } from "react";
import { redirect } from "react-router";
import { api } from "../utils/serviceAPI";
import type { Message, SchoolClass, UserSummary } from "../utils/serviceAPI";
import { Client } from "@stomp/stompjs";
import {
  FaComments,
  FaPaperPlane,
  FaUsers,
  FaUserSecret,
  FaHashtag,
} from "react-icons/fa";

export async function clientLoader() {
  if (!api.isAuthenticated()) throw redirect("/");
  return {};
}

type ChatMode = "class" | "private";

export default function Chat() {
  const user = api.getUser();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [allUsers, setAllUsers] = useState<UserSummary[]>([]);
  const [chatMode, setChatMode] = useState<ChatMode>("class");
  const [messages, setMessages] = useState<Message[]>([]);
  const [privateMessages, setPrivateMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [privateReceiverId, setPrivateReceiverId] = useState("");
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const classSubscriptionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
    connectWebSocket();
    return () => {
      if (clientRef.current) clientRef.current.deactivate();
    };
  }, []);

  useEffect(() => {
    if (selectedClassId && chatMode === "class") {
      loadClassMessages();
    }
  }, [selectedClassId, chatMode]);

  useEffect(() => {
    if (chatMode === "private") {
      loadPrivateMessages();
    }
  }, [chatMode]);

  // Manage dynamic class subscription
  useEffect(() => {
    if (!connected || !clientRef.current) return;

    if (classSubscriptionRef.current) {
      classSubscriptionRef.current.unsubscribe();
      classSubscriptionRef.current = null;
    }

    if (selectedClassId) {
      classSubscriptionRef.current = clientRef.current.subscribe(`/topic/class/${selectedClassId}`, (msg) => {
        const message: Message = JSON.parse(msg.body);
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m.id === message.id && message.id)) return prev;
          return [...prev, message];
        });
        setTimeout(scrollToBottom, 100);
      });
    }

    return () => {
      if (classSubscriptionRef.current) {
        classSubscriptionRef.current.unsubscribe();
      }
    };
  }, [connected, selectedClassId]);

  async function loadData() {
    try {
      setLoading(true);
      await Promise.all([loadClasses(), loadUsers()]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadClasses() {
    try {
      const cls = user?.role === "ROLE_ADMIN" ? await api.getAdminClasses() : await api.getMyClasses();
      setClasses(cls);
      if (cls.length > 0) setSelectedClassId(cls[0].id);
    } catch (e) { console.error(e); }
  }

  async function loadUsers() {
    try {
      const users = user?.role === "ROLE_ADMIN" ? await api.getAllUsers() : await api.getUsers();
      setAllUsers(users.filter(u => u.id !== user?.id));
    } catch (e) { console.error(e); }
  }

  async function loadClassMessages() {
    try {
      const msgs = await api.getClassMessages(selectedClassId);
      setMessages(msgs);
      setTimeout(scrollToBottom, 100);
    } catch (e) { console.error(e); }
  }

  async function loadPrivateMessages() {
    try {
      const msgs = await api.getPrivateMessages();
      setPrivateMessages(msgs);
      setTimeout(scrollToBottom, 100);
    } catch (e) { console.error(e); }
  }

  function connectWebSocket() {
    const token = api.getToken();
    if (!token) return;

    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const client = new Client({
      brokerURL: `${wsProtocol}//${window.location.host}/ws`,
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        setConnected(true);

        // Subscribe to private messages globally
        client.subscribe(`/user/queue/messages`, (msg) => {
          const message: Message = JSON.parse(msg.body);
          setPrivateMessages(prev => {
            if (prev.some(m => m.id === message.id && message.id)) return prev;
            return [...prev, message];
          });
          setTimeout(scrollToBottom, 100);
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError: (frame) => console.error("STOMP error:", frame),
    });

    client.activate();
    clientRef.current = client;
  }

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !clientRef.current?.connected) return;

    if (chatMode === "class") {
      clientRef.current.publish({
        destination: "/app/chat.class",
        body: JSON.stringify({
          classId: selectedClassId,
          content: newMessage.trim(),
        }),
      });
    } else {
      if (!privateReceiverId.trim()) return;
      clientRef.current.publish({
        destination: "/app/chat.private",
        body: JSON.stringify({
          receiverId: privateReceiverId.trim(),
          content: newMessage.trim(),
        }),
      });
    }

    setNewMessage("");
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  const currentMessages = chatMode === "class" 
    ? messages 
    : privateMessages.filter(m => m.senderId === privateReceiverId || m.receiverId === privateReceiverId);
  const currentClassName = classes.find(c => c.id === selectedClassId)?.name || "";

  return (
    <div className="animate-fade-in" style={{ height: "calc(100vh - 100px)", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
          <FaComments style={{ marginRight: 10, color: "var(--color-primary)" }} />
          Czat
          <span style={{ marginLeft: 10 }}>
            {connected ? (
              <span className="badge badge-success" style={{ fontSize: "0.7rem" }}>Online</span>
            ) : (
              <span className="badge badge-danger" style={{ fontSize: "0.7rem" }}>Offline</span>
            )}
          </span>
        </h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className={`btn btn-sm ${chatMode === "class" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setChatMode("class")}
          >
            <FaUsers size={13} /> Czat klasy
          </button>
          <button
            className={`btn btn-sm ${chatMode === "private" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setChatMode("private")}
          >
            <FaUserSecret size={13} /> Prywatny
          </button>
        </div>
      </div>

      {/* Class Selector / Private Receiver */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        {chatMode === "class" ? (
          <select
            className="form-input"
            style={{ width: "auto", padding: "8px 16px", minWidth: 200 }}
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        ) : (
          <select
            className="form-input"
            style={{ maxWidth: 350 }}
            value={privateReceiverId}
            onChange={(e) => setPrivateReceiverId(e.target.value)}
          >
            <option value="">Wybierz użytkownika...</option>
            {allUsers.map(u => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName} {u.role === "ROLE_ADMIN" ? "(Admin)" : ""}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Messages Area */}
      <div
        className="card"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: 0,
          overflow: "hidden",
        }}
      >
        {/* Chat Header */}
        <div style={{
          padding: "12px 20px",
          borderBottom: "1px solid #f0e6d4",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "var(--color-cream-light)",
        }}>
          <FaHashtag style={{ color: "var(--color-accent)" }} />
          <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>
            {chatMode === "class" ? currentClassName : "Wiadomości prywatne"}
          </span>
        </div>

        {/* Messages List */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}>
          {currentMessages.length === 0 ? (
            <div className="empty-state" style={{ padding: "40px 0" }}>
              <FaComments style={{ fontSize: "2.5rem", opacity: 0.2, color: "var(--color-primary)" }} />
              <p style={{ marginTop: 12 }}>Brak wiadomości. Zacznij konwersację!</p>
            </div>
          ) : (
            currentMessages.map((msg, i) => {
              const isMe = msg.senderId === user?.id;
              const sender = allUsers.find(u => u.id === msg.senderId);
              const senderName = isMe ? null : (sender ? `${sender.firstName} ${sender.lastName}` : msg.senderId.slice(0, 8) + "...");
              
              let msgDate = new Date();
              if (typeof msg.timestamp === 'string') msgDate = new Date(msg.timestamp);
              else if (typeof msg.timestamp === 'number') msgDate = new Date(msg.timestamp < 2000000000 ? msg.timestamp * 1000 : msg.timestamp);
              else if ((msg.timestamp as any)?.epochSecond) msgDate = new Date((msg.timestamp as any).epochSecond * 1000);

              return (
                <div
                  key={msg.id || i}
                  style={{
                    display: "flex",
                    justifyContent: isMe ? "flex-end" : "flex-start",
                    alignItems: "flex-end",
                    gap: 8,
                  }}
                >
                  {!isMe && (
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: "var(--color-primary)", color: "white",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, fontSize: "0.6rem", overflow: "hidden", flexShrink: 0,
                    }}>
                      {sender?.avatarUrl ? (
                        <img src={sender.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <>{sender?.firstName?.[0] || "?"}{sender?.lastName?.[0] || ""}</>
                      )}
                    </div>
                  )}
                  <div
                    style={{
                      maxWidth: "70%",
                      padding: "10px 16px",
                      borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      background: isMe
                        ? "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))"
                        : "var(--color-cream)",
                      color: isMe ? "white" : "var(--text-primary)",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    {!isMe && senderName && (
                      <div style={{
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        marginBottom: 4,
                        color: "var(--color-primary-deeper)",
                      }}>
                        {senderName}
                      </div>
                    )}
                    <div style={{ fontSize: "0.9rem", lineHeight: 1.4 }}>{msg.content}</div>
                    <div style={{
                      fontSize: "0.65rem",
                      marginTop: 4,
                      textAlign: "right",
                      opacity: 0.7,
                    }}>
                      {msgDate.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={sendMessage}
          style={{
            padding: "12px 20px",
            borderTop: "1px solid #f0e6d4",
            display: "flex",
            gap: 10,
            background: "var(--color-cream-light)",
          }}
        >
          <input
            className="form-input"
            style={{ flex: 1, borderRadius: "var(--radius-pill)" }}
            placeholder="Napisz wiadomość..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button
            type="submit"
            className="btn btn-primary btn-icon"
            disabled={!connected || !newMessage.trim()}
            style={{ width: 44, height: 44 }}
          >
            <FaPaperPlane size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
