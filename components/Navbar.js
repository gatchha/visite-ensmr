import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Navbar({ isLoggedIn = false }) {
  const router = useRouter();
  const [userType, setUserType] = useState(null);
  const [adminRole, setAdminRole] = useState(null);

  useEffect(() => {
    // Détecter le type d'utilisateur connecté
    const storedUserType = localStorage.getItem("userType");
    const storedAdminRole = localStorage.getItem("adminRole");
    setUserType(storedUserType);
    setAdminRole(storedAdminRole);
  }, []);

  const handleLogout = () => {
    // Supprimer toutes les données utilisateur du localStorage
    localStorage.removeItem("etudiant");
    localStorage.removeItem("user");
    localStorage.removeItem("userType");
    localStorage.removeItem("adminRole");
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleLogin = () => {
    router.push("/login");
  };

  const getDashboardLink = () => {
    if (userType === "admin") {
      return "/admins/dashboard";
    } else if (userType === "etudiant") {
      return "/etudiant/";
    }
    return "/";
  };

  const getAboutLink = () => {
    if (userType === "admin") {
      return "/admins/about";
    } else if (userType === "etudiant") {
      return "#footer";
    }
    return "#footer";
  };

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1rem 2rem",
        backgroundColor: "#ffffff",
        color: "#002147",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
      }}
    >
      {/* Logo ENSMR */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <img
          src="/images/logo-ENIM.png"
          alt="ENSMR Logo"
          style={{
            height: "40px",
            transform: "scale(1.3)",
            transformOrigin: "left center",
          }}
        />
      </div>

      {/* Liens de navigation */}
      <div style={{ display: "flex", gap: "2rem", fontSize: "1rem" }}>
        <a 
          href="/" 
          style={{ color: "#002147", textDecoration: "none", cursor: "pointer" }}
          onClick={(e) => {
            e.preventDefault();
            router.push("/");
          }}
        >
          Accueil
        </a>

        {/* Affiche "Tableau de bord" uniquement si connecté */}
        {isLoggedIn && userType === "admin" && (
          <a
            href={getDashboardLink()}
            style={{ color: "#002147", textDecoration: "none", cursor: "pointer" }}
            onClick={(e) => {
              e.preventDefault();
              router.push(getDashboardLink());
            }}
          >
            Tableau de bord
          </a>
        )}

        {/* Affiche "Tableau de bord" pour les étudiants */}
        {isLoggedIn && userType === "etudiant" && (
          <a
            href={getDashboardLink()}
            style={{ color: "#002147", textDecoration: "none", cursor: "pointer" }}
            onClick={(e) => {
              e.preventDefault();
              router.push(getDashboardLink());
            }}
          >
            Tableau de bord
          </a>
        )}

        {/* 🆕 MODIFIÉ : Affiche "Mon Profil" pour les admins ET les étudiants */}
        {isLoggedIn && (userType === "admin" || userType === "etudiant") && (
          <a
            href={userType === "admin" ? "/admins/profil" : "/etudiant/profil"}
            style={{ color: "#002147", textDecoration: "none", cursor: "pointer" }}
            onClick={(e) => {
              e.preventDefault();
              router.push(userType === "admin" ? "/admins/profil" : "/etudiant/profil");
            }}
          >
            Mon Profil
          </a>
        )}

        {/* 🆕 CORRIGÉ : Le bouton affiche "Déconnexion" si connecté */}
        {isLoggedIn ? (
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: "#002147",
              color: "#ffffff",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Déconnexion
          </button>
        ) : (
          <button
            onClick={handleLogin}
            style={{
              backgroundColor: "#002147",
              color: "#ffffff",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Connexion
          </button>
        )}
      </div>
    </nav>
  );
}