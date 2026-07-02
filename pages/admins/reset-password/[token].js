import { useState } from "react";
import { useRouter } from "next/router";

export default function AdminResetPassword() {
  const router = useRouter();
  const { token } = router.query;

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError("Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/reset-password-admin/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        setDone(true);
        setMessage(data.message);
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setError(data.message || "Erreur lors de la réinitialisation.");
      }
    } catch {
      setError("Erreur serveur, veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = {
    backgroundColor: "#f9f9f9",
    padding: "2.5rem",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: "420px",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", padding: "1rem" }}>
      <div style={cardStyle}>
        <h3 style={{ color: "#002147", textAlign: "center", marginBottom: "1.5rem" }}>
          Nouveau mot de passe administrateur
        </h3>

        {done ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 70, height: 70, backgroundColor: "#d4edda", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", margin: "0 auto 1rem" }}>
              <span style={{ fontSize: 36, color: "#155724" }}>✓</span>
            </div>
            <p style={{ color: "#155724", fontWeight: "bold" }}>{message}</p>
            <p style={{ color: "#666", fontSize: "14px" }}>Redirection vers la connexion...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "4px", color: "#333" }}>
                Nouveau mot de passe
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="8 caractères min, maj, min, chiffre"
                style={{ width: "100%", padding: "0.65rem", border: "1px solid #ced4da", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "4px", color: "#333" }}>
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="Répétez le mot de passe"
                style={{ width: "100%", padding: "0.65rem", border: "1px solid #ced4da", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
              />
            </div>

            {error && (
              <div style={{ backgroundColor: "#f8d7da", color: "#721c24", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem", fontSize: "14px" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: "100%", padding: "0.75rem", backgroundColor: "#002147", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Réinitialisation..." : "Changer le mot de passe"}
            </button>

            <div style={{ textAlign: "center", marginTop: "1rem" }}>
              <button
                type="button"
                onClick={() => router.push("/login")}
                style={{ background: "none", border: "none", color: "#6c757d", textDecoration: "underline", cursor: "pointer", fontSize: "13px" }}
              >
                Retour à la connexion
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
