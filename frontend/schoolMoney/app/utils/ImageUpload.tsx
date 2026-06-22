import { useState, useRef } from "react";
import { api } from "./serviceAPI";
import { FaCloudUploadAlt, FaTimes, FaSpinner, FaImage } from "react-icons/fa";

interface ImageUploadProps {
  currentUrl?: string;
  onUploaded: (url: string) => void;
  label?: string;
}

export default function ImageUpload({ currentUrl, onUploaded, label = "Zdjęcie" }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Dozwolone są tylko pliki graficzne");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Plik jest za duży (max 5 MB)");
      return;
    }

    setError(null);
    setUploading(true);

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    try {
      const result = await api.uploadImage(file);
      setPreview(result.url);
      onUploaded(result.url);
    } catch (e: any) {
      setError(e?.message || "Błąd uploadu");
      setPreview(currentUrl || null);
    } finally {
      setUploading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleRemove() {
    setPreview(null);
    onUploaded("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          position: "relative",
          border: `2px dashed ${dragOver ? "var(--color-primary)" : error ? "#e74c3c" : "#d5c8b5"}`,
          borderRadius: "var(--radius-md, 12px)",
          padding: preview ? 0 : "24px 16px",
          textAlign: "center",
          cursor: uploading ? "wait" : "pointer",
          background: dragOver ? "rgba(196, 164, 105, 0.06)" : "var(--color-cream-light, #faf6f0)",
          transition: "all 0.2s ease",
          overflow: "hidden",
          minHeight: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          style={{ display: "none" }}
        />

        {uploading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: "var(--text-muted)" }}>
            <FaSpinner className="spin-icon" style={{ fontSize: "1.5rem", animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: "0.85rem" }}>Przesyłanie...</span>
          </div>
        ) : preview ? (
          <div style={{ position: "relative", width: "100%" }}>
            <img
              src={preview}
              alt="Podgląd"
              style={{
                width: "100%",
                maxHeight: 180,
                objectFit: "cover",
                display: "block",
                borderRadius: "var(--radius-md, 12px)",
              }}
            />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleRemove(); }}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.6)",
                color: "white",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
                transition: "background 0.2s",
              }}
              title="Usuń zdjęcie"
            >
              <FaTimes />
            </button>
            <div style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "6px",
              background: "linear-gradient(transparent, rgba(0,0,0,0.5))",
              color: "white",
              fontSize: "0.75rem",
              textAlign: "center",
              borderRadius: "0 0 var(--radius-md, 12px) var(--radius-md, 12px)",
            }}>
              Kliknij aby zmienić
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--color-primary, #c4a469), var(--color-primary-dark, #a88b4a))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "1.2rem",
              marginBottom: 4,
            }}>
              <FaCloudUploadAlt />
            </div>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
              Kliknij lub przeciągnij plik
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              <FaImage style={{ marginRight: 4 }} />
              PNG, JPG, GIF do 5 MB
            </span>
          </div>
        )}
      </div>

      {error && (
        <div style={{ color: "#e74c3c", fontSize: "0.8rem", marginTop: 6 }}>
          {error}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
