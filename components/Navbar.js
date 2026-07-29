import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Navbar({ isLoggedIn = false }) {
  const router = useRouter();
  const [userType, setUserType] = useState(null);
  const [adminRole, setAdminRole] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Détecter le type d'utilisateur connecté
    const storedUserType = localStorage.getItem("userType");
    const storedAdminRole = localStorage.getItem("adminRole");
    setUserType(storedUserType);
    setAdminRole(storedAdminRole);
  }, []);

  const navigate = (href) => {
    setMenuOpen(false);
    router.push(href);
  };

  const handleLogout = () => {
    setMenuOpen(false);
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
    <nav className="ensmr-nav">
      <img
        src="/images/logo-ENIM.png"
        alt="ENSMR Logo"
        className="ensmr-logo"
        onClick={() => navigate(isLoggedIn ? getDashboardLink() : "/")}
      />

      <button
        className="ensmr-burger"
        aria-label="Menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      <div className={`ensmr-links${menuOpen ? " open" : ""}`}>
        {isLoggedIn && (userType === "admin" || userType === "etudiant") && (
          <a
            href={getDashboardLink()}
            onClick={(e) => { e.preventDefault(); navigate(getDashboardLink()); }}
          >
            Tableau de bord
          </a>
        )}

        {isLoggedIn && (userType === "admin" || userType === "etudiant") && (
          <a
            href={userType === "admin" ? "/admins/profil" : "/etudiant/profil"}
            onClick={(e) => {
              e.preventDefault();
              navigate(userType === "admin" ? "/admins/profil" : "/etudiant/profil");
            }}
          >
            Mon Profil
          </a>
        )}

        <button className="ensmr-cta" onClick={isLoggedIn ? handleLogout : handleLogin}>
          {isLoggedIn ? "Déconnexion" : "Connexion"}
        </button>
      </div>

      <style jsx>{`
        .ensmr-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 2rem;
          background-color: #ffffff;
          color: #002147;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .ensmr-logo {
          height: 52px;
          width: auto;
          display: block;
          cursor: pointer;
          flex-shrink: 0;
        }

        .ensmr-burger {
          display: none;
          background: none;
          border: none;
          color: #002147;
          font-size: 1.5rem;
          line-height: 1;
          padding: 0.25rem 0.4rem;
          cursor: pointer;
        }

        .ensmr-links {
          display: flex;
          align-items: center;
          gap: 2rem;
          font-size: 1rem;
        }

        .ensmr-links :global(a) {
          color: #002147;
          text-decoration: none;
          cursor: pointer;
          white-space: nowrap;
        }

        .ensmr-cta {
          background-color: #002147;
          color: #ffffff;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
          white-space: nowrap;
        }

        @media (max-width: 900px) {
          .ensmr-nav {
            padding: 0.6rem 1rem;
            flex-wrap: wrap;
          }

          .ensmr-logo {
            height: 42px;
          }

          .ensmr-burger {
            display: block;
          }

          .ensmr-links {
            display: none;
            width: 100%;
            flex-direction: column;
            align-items: stretch;
            gap: 0;
            padding-top: 0.6rem;
            margin-top: 0.6rem;
            border-top: 1px solid #e2e8ee;
          }

          .ensmr-links.open {
            display: flex;
          }

          .ensmr-links :global(a) {
            padding: 0.85rem 0.25rem;
            border-bottom: 1px solid #f0f3f6;
          }

          .ensmr-cta {
            margin-top: 0.75rem;
            width: 100%;
            padding: 0.75rem 1rem;
          }
        }
      `}</style>
    </nav>
  );
}