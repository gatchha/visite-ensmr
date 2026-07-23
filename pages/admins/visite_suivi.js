import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Navbar from "../../components/Navbar";

const FORM_VIDE = {
  niveau: "1A",
  date_visite: "",
  entreprise: "",
  adresse: "",
  ville: "",
  heure_arrivee: "",
  heure_depart: "",
  nb_gr_eleves: "",
  nb_eleves: "",
  mode_transport_eleve: "Ecole",
  nb_professeurs: "",
  mode_transport_prof: "Service",
  nom_professeur: "",
  observations: "",
  filieres: [],
};

function authFetch(url, options = {}) {
  const token = localStorage.getItem("token");
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
}

export default function VisitesSuivi() {
  const router = useRouter();
  const [visites, setVisites] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtreNiveau, setFiltreNiveau] = useState("");
  const [filtreFiliere, setFiltreFiliere] = useState("");
  const [adminRole, setAdminRole] = useState(null);
  const [visiteEnEdition, setVisiteEnEdition] = useState(null);
  const [formEdition, setFormEdition] = useState(FORM_VIDE);
  const [messageEdition, setMessageEdition] = useState("");
  const [messageGlobal, setMessageGlobal] = useState({ texte: "", type: "" });

  useEffect(() => {
    if (router.query.message) {
      setMessageGlobal({ texte: router.query.message, type: "success" });
      setTimeout(() => setMessageGlobal({ texte: "", type: "" }), 4000);
    }
  }, [router.query.message]);

  useEffect(() => {
    const role = localStorage.getItem("adminRole");
    setAdminRole(role);

    authFetch("/api/visites/filieres")
      .then((res) => res.json())
      .then((data) => setFilieres(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Erreur chargement filières:", err));
  }, []);

  useEffect(() => {
    chargerVisites();
  }, [filtreNiveau, filtreFiliere]);

  const chargerVisites = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtreNiveau) params.append("niveau", filtreNiveau);
    if (filtreFiliere) params.append("filiere_id", filtreFiliere);

    authFetch(`/api/visites?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setVisites(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Erreur chargement visites:", err))
      .finally(() => setLoading(false));
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer cette visite ?")) return;
    try {
      const res = await authFetch(`/api/visites/${id}`, { method: "DELETE" });
      if (res.ok) chargerVisites();
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
    }
  };

  const ouvrirEdition = async (id) => {
    try {
      const res = await authFetch(`/api/visites/${id}`);
      const data = await res.json();
      setFormEdition({
        niveau: data.niveau || "1A",
        date_visite: data.date_visite ? data.date_visite.slice(0, 10) : "",
        entreprise: data.entreprise || "",
        adresse: data.adresse || "",
        ville: data.ville || "",
        heure_arrivee: data.heure_arrivee || "",
        heure_depart: data.heure_depart || "",
        nb_gr_eleves: data.nb_gr_eleves || "",
        nb_eleves: data.nb_eleves || "",
        mode_transport_eleve: data.mode_transport_eleve || "Ecole",
        nb_professeurs: data.nb_professeurs || "",
        mode_transport_prof: data.mode_transport_prof || "Service",
        nom_professeur: data.nom_professeur || "",
        observations: data.observations || "",
        filieres: data.filiere_ids || [],
      });
      setVisiteEnEdition(id);
      setMessageEdition("");
    } catch (err) {
      console.error("Erreur chargement visite:", err);
    }
  };

  const fermerEdition = () => {
    setVisiteEnEdition(null);
    setMessageEdition("");
  };

  const handleChangeEdition = (e) => {
    const { name, value } = e.target;
    setFormEdition((prev) => ({ ...prev, [name]: value }));
  };

  const handleFiliereToggleEdition = (id) => {
    setFormEdition((prev) => {
      const present = prev.filieres.includes(id);
      return {
        ...prev,
        filieres: present ? prev.filieres.filter((f) => f !== id) : [...prev.filieres, id],
      };
    });
  };

  const handleSauvegarder = async (e) => {
    e.preventDefault();
    setMessageEdition("");

    const aujourd_hui = new Date();
    aujourd_hui.setHours(0, 0, 0, 0);
    const dateVisite = new Date(formEdition.date_visite);
    const diffJours = Math.ceil((dateVisite - aujourd_hui) / (1000 * 60 * 60 * 24));
    if (diffJours < 10) {
      setMessageEdition("La visite doit être saisie au minimum 10 jours avant la date prévue.");
      return;
    }

    try {
      const res = await authFetch(`/api/visites/${visiteEnEdition}`, {
        method: "PUT",
        body: JSON.stringify(formEdition),
      });
      const data = await res.json();
      if (res.ok) {
        fermerEdition();
        chargerVisites();
        setMessageGlobal({ texte: "Visite modifiée avec succès.", type: "success" });
        setTimeout(() => setMessageGlobal({ texte: "", type: "" }), 4000);
      } else {
        setMessageEdition(data.message || "Erreur lors de la modification.");
      }
    } catch (err) {
      setMessageEdition("Erreur serveur.");
    }
  };

  const handleValider = async (id) => {
    if (!confirm("Valider cette visite et envoyer la notification aux étudiants ?")) return;
    try {
      const res = await authFetch(`/api/visites/${id}/valider`, { method: "PATCH" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Erreur lors de la validation.");
      }
    } catch (err) {
      console.error("Erreur validation:", err);
    } finally {
      chargerVisites();
    }
  };

  const downloadPdf = async (visiteId, filiereId, type) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`/api/visites/${visiteId}/${type}-pdf/${filiereId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const cd = response.headers.get("Content-Disposition");
      const match = cd && cd.match(/filename="?([^"]+)"?/);
      a.download = match ? match[1] : "document.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Erreur téléchargement PDF:", err);
    }
  };

  const viewPdf = async (visiteId, filiereId, type) => {
    const win = window.open("", "_blank");
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`/api/visites/${visiteId}/${type}-pdf/${filiereId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const blob = await response.blob();
        win.location.href = window.URL.createObjectURL(blob);
      } else {
        win.close();
      }
    } catch {
      win.close();
    }
  };

  const badgeStatut = (statut) => {
    if (statut === "validee") return <span className="badge bg-success">Validée</span>;
    return <span className="badge bg-warning text-dark">En attente</span>;
  };

  return (
    <>
      <Navbar isLoggedIn={true} />
      <div className="container" style={{ marginTop: "100px", marginBottom: "50px" }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2>Suivi des visites</h2>
          <Link href="/admins/visites" className="btn btn-primary">
            Saisir une visite
          </Link>
        </div>

        {messageGlobal.texte && (
          <div className={`alert alert-${messageGlobal.type === "success" ? "success" : "danger"}`}>
            {messageGlobal.texte}
          </div>
        )}

        <div className="row mb-3">
          <div className="col">
            <label className="form-label">Niveau</label>
            <select className="form-select" value={filtreNiveau} onChange={(e) => setFiltreNiveau(e.target.value)}>
              <option value="">Tous</option>
              <option value="1A">1A</option>
              <option value="2A">2A</option>
              <option value="3A">3A</option>
            </select>
          </div>
          <div className="col">
            <label className="form-label">
              {filtreNiveau === "1A" ? "Tronc commun" : "Filière"}
            </label>
            <select className="form-select" value={filtreFiliere} onChange={(e) => setFiltreFiliere(e.target.value)}>
              <option value="">Toutes</option>
              {filieres
                .filter((f) => {
                  if (filtreNiveau === "3A") return f.est_3a && f.email_3a;
                  return !f.est_3a;
                })
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {`${f.nom_filiere} (${f.nom_departement})`}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p>Chargement...</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Niveau</th>
                  <th>Entreprise</th>
                  <th>Ville</th>
                  <th>Filières</th>
                  <th>Nb élèves</th>
                  <th>Professeur(s)</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visites.map((v) => (
                  <tr key={v.id}>
                    <td>{v.date_visite ? new Date(v.date_visite).toLocaleDateString("fr-FR") : ""}</td>
                    <td>{v.niveau}</td>
                    <td>{v.entreprise}</td>
                    <td>{v.ville}</td>
                    <td>{v.filieres}</td>
                    <td>{v.nb_eleves}</td>
                    <td>{v.nom_professeur}</td>
                    <td>{badgeStatut(v.statut)}</td>
                    <td>
                      <div style={{ whiteSpace: "nowrap" }}>
                        <button
                          className="btn btn-sm btn-secondary me-1"
                          onClick={() => ouvrirEdition(v.id)}
                        >
                          Modifier
                        </button>
                        {adminRole === "principal" && v.statut !== "validee" && (
                          <button
                            className="btn btn-sm btn-success me-1"
                            onClick={() => handleValider(v.id)}
                          >
                            Valider
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(v.id)}
                        >
                          Supprimer
                        </button>
                      </div>
                      {v.statut === "validee" && Array.isArray(v.filieres_data) && (
                        <div style={{ marginTop: 8, borderTop: "1px solid #dee2e6", paddingTop: 6 }}>
                          {v.filieres_data.map((f) => (
                            <div key={f.id} style={{ marginBottom: 6 }}>
                              <small style={{ display: "block", color: "#555", marginBottom: 3, fontWeight: 500 }}>
                                {f.nom}
                              </small>
                              <button
                                className="btn btn-sm btn-outline-primary me-1"
                                style={{ fontSize: "0.75rem", padding: "2px 6px" }}
                                onClick={() => viewPdf(v.id, f.id, "notice")}
                              >
                                Notice
                              </button>
                              <button
                                className="btn btn-sm btn-outline-secondary me-1"
                                style={{ fontSize: "0.75rem", padding: "2px 6px" }}
                                onClick={() => downloadPdf(v.id, f.id, "notice")}
                              >
                                ↓ Notice
                              </button>
                              <button
                                className="btn btn-sm btn-outline-primary me-1"
                                style={{ fontSize: "0.75rem", padding: "2px 6px" }}
                                onClick={() => viewPdf(v.id, f.id, "emargement")}
                              >
                                Émargement
                              </button>
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                style={{ fontSize: "0.75rem", padding: "2px 6px" }}
                                onClick={() => downloadPdf(v.id, f.id, "emargement")}
                              >
                                ↓ Émargement
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {visiteEnEdition && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050, overflowY: "auto",
          }}
        >
          <div
            className="container"
            style={{ backgroundColor: "#fff", borderRadius: 8, padding: 30, marginTop: 60, marginBottom: 60, maxWidth: 700 }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4>Modifier la visite</h4>
              <button className="btn-close" onClick={fermerEdition}></button>
            </div>

            {messageEdition && (
              <div className={`alert ${messageEdition.includes("succès") ? "alert-success" : "alert-danger"}`}>
                {messageEdition}
              </div>
            )}

            <form onSubmit={handleSauvegarder}>
              <div className="mb-3">
                <label className="form-label">Niveau</label>
                <select className="form-select" name="niveau" value={formEdition.niveau} onChange={handleChangeEdition}>
                  <option value="1A">1A</option>
                  <option value="2A">2A</option>
                  <option value="3A">3A</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Date de la visite</label>
                <input type="date" className="form-control" name="date_visite" value={formEdition.date_visite} onChange={handleChangeEdition} required />
              </div>

              <div className="mb-3">
                <label className="form-label">Entreprise</label>
                <input type="text" className="form-control" name="entreprise" value={formEdition.entreprise} onChange={handleChangeEdition} required />
              </div>

              <div className="mb-3">
                <label className="form-label">Adresse</label>
                <input type="text" className="form-control" name="adresse" value={formEdition.adresse} onChange={handleChangeEdition} required />
              </div>

              <div className="mb-3">
                <label className="form-label">Ville</label>
                <input type="text" className="form-control" name="ville" value={formEdition.ville} onChange={handleChangeEdition} required list="villes-list-edit" autoComplete="off" />
                <datalist id="villes-list-edit">
                  <option value="Rabat" />
                  <option value="Casablanca" />
                  <option value="Fès" />
                  <option value="Marrakech" />
                  <option value="Tanger" />
                  <option value="Agadir" />
                  <option value="Meknès" />
                  <option value="Oujda" />
                  <option value="Kénitra" />
                  <option value="Tétouan" />
                  <option value="Safi" />
                  <option value="El Jadida" />
                  <option value="Beni Mellal" />
                  <option value="Nador" />
                  <option value="Khouribga" />
                  <option value="Settat" />
                  <option value="Berrechid" />
                  <option value="Khémisset" />
                  <option value="Ifrane" />
                  <option value="Laâyoune" />
                </datalist>
              </div>

              <div className="row mb-3">
                <div className="col">
                  <label className="form-label">Heure d'arrivée</label>
                  <input type="time" className="form-control" name="heure_arrivee" value={formEdition.heure_arrivee} onChange={handleChangeEdition} required />
                </div>
                <div className="col">
                  <label className="form-label">Heure de départ</label>
                  <input type="time" className="form-control" name="heure_depart" value={formEdition.heure_depart} onChange={handleChangeEdition} required />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col">
                  <label className="form-label">Nombre de groupes d'élèves</label>
                  <input type="number" className="form-control" name="nb_gr_eleves" value={formEdition.nb_gr_eleves} onChange={handleChangeEdition} required />
                </div>
                <div className="col">
                  <label className="form-label">Nombre d'élèves</label>
                  <input type="number" className="form-control" name="nb_eleves" value={formEdition.nb_eleves} onChange={handleChangeEdition} required />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Transport des élèves</label>
                <select className="form-select" name="mode_transport_eleve" value={formEdition.mode_transport_eleve} onChange={handleChangeEdition}>
                  <option value="Ecole">Ecole</option>
                  <option value="Prestataire">Prestataire</option>
                </select>
              </div>

              <div className="row mb-3">
                <div className="col">
                  <label className="form-label">Nombre de professeurs</label>
                  <input type="number" className="form-control" name="nb_professeurs" value={formEdition.nb_professeurs} onChange={handleChangeEdition} required />
                </div>
                <div className="col">
                  <label className="form-label">Transport des professeurs</label>
                  <select className="form-select" name="mode_transport_prof" value={formEdition.mode_transport_prof} onChange={handleChangeEdition}>
                    <option value="Service">Service</option>
                    <option value="Personnel">Personnel</option>
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Nom du/des professeur(s)</label>
                <input type="text" className="form-control" name="nom_professeur" value={formEdition.nom_professeur} onChange={handleChangeEdition} required />
              </div>

              <div className="mb-3">
                <label className="form-label">
                  {formEdition.niveau === "1A" ? "Troncs communs concernés" : "Filières concernées"}
                </label>
                <div>
                  {filieres
                    .filter((f) => {
                      if (formEdition.niveau === "3A") return f.est_3a;
                      return !f.est_3a;
                    })
                    .map((f) => (
                      <div className="form-check" key={f.id}>
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`edit-filiere-${f.id}`}
                          checked={formEdition.filieres.includes(f.id)}
                          onChange={() => handleFiliereToggleEdition(f.id)}
                        />
                        <label className="form-check-label" htmlFor={`edit-filiere-${f.id}`}>
                          {`${f.nom_filiere} (${f.nom_departement})`}
                        </label>
                      </div>
                    ))}
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Observations</label>
                <textarea className="form-control" name="observations" value={formEdition.observations} onChange={handleChangeEdition} />
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary">Enregistrer</button>
                <button type="button" className="btn btn-secondary" onClick={fermerEdition}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
