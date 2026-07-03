import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../../components/Navbar";

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

export default function AdminVisites() {
  const router = useRouter();
  const [filieres, setFilieres] = useState([]);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
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
  });

  useEffect(() => {
    authFetch("/api/visites/filieres")
      .then((res) => res.json())
      .then((data) => setFilieres(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Erreur chargement des filières:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'niveau' ? { filieres: [] } : {}),
    }));
  };

  const handleFiliereToggle = (id) => {
    setForm((prev) => {
      const dejaSelectionne = prev.filieres.includes(id);
      return {
        ...prev,
        filieres: dejaSelectionne
          ? prev.filieres.filter((f) => f !== id)
          : [...prev.filieres, id],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await authFetch("/api/visites", {
        method: "POST",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/admins/visite_suivi?message=Visite+enregistrée+avec+succès");
      } else {
        setMessage(data.message || "Erreur lors de l'enregistrement");
      }
    } catch (err) {
      console.error(err);
      setMessage("Erreur serveur");
    }
  };

  return (
    <>
      <Navbar isLoggedIn={true} />
      <div className="container" style={{ marginTop: "100px", marginBottom: "50px" }}>
        <h2>Saisir une visite</h2>
        {message && <div className="alert alert-info">{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Niveau</label>
            <select className="form-select" name="niveau" value={form.niveau} onChange={handleChange}>
              <option value="1A">1A</option>
              <option value="2A">2A</option>
              <option value="3A">3A</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Date de la visite <span style={{ color: '#888', fontSize: '0.875em' }}>(minimum 7 jours)</span></label>
            <input type="date" className="form-control" name="date_visite" value={form.date_visite} onChange={handleChange} required />
          </div>

          <div className="mb-3">
            <label className="form-label">Entreprise</label>
            <input type="text" className="form-control" name="entreprise" value={form.entreprise} onChange={handleChange} required />
          </div>

          <div className="mb-3">
            <label className="form-label">Adresse</label>
            <input type="text" className="form-control" name="adresse" value={form.adresse} onChange={handleChange} required />
          </div>

          <div className="mb-3">
            <label className="form-label">Ville</label>
            <input type="text" className="form-control" name="ville" value={form.ville} onChange={handleChange} required list="villes-list" autoComplete="off" />
            <datalist id="villes-list">
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
              <input type="time" className="form-control" name="heure_arrivee" value={form.heure_arrivee} onChange={handleChange} required />
            </div>
            <div className="col">
              <label className="form-label">Heure de départ</label>
              <input type="time" className="form-control" name="heure_depart" value={form.heure_depart} onChange={handleChange} required />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col">
              <label className="form-label">Nombre de groupes d'élèves</label>
              <input type="number" className="form-control" name="nb_gr_eleves" value={form.nb_gr_eleves} onChange={handleChange} required />
            </div>
            <div className="col">
              <label className="form-label">Nombre d'élèves</label>
              <input type="number" className="form-control" name="nb_eleves" value={form.nb_eleves} onChange={handleChange} required />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Transport des élèves</label>
            <select className="form-select" name="mode_transport_eleve" value={form.mode_transport_eleve} onChange={handleChange}>
              <option value="Ecole">Ecole</option>
              <option value="Prestataire">Prestataire</option>
            </select>
          </div>

          <div className="row mb-3">
            <div className="col">
              <label className="form-label">Nombre de professeurs accompagnateurs</label>
              <input type="number" className="form-control" name="nb_professeurs" value={form.nb_professeurs} onChange={handleChange} required />
            </div>
            <div className="col">
              <label className="form-label">Transport des professeurs</label>
              <select className="form-select" name="mode_transport_prof" value={form.mode_transport_prof} onChange={handleChange}>
                <option value="Service">Service</option>
                <option value="Personnel">Personnel</option>
              </select>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Professeur(s) accompagnateur(s)</label>
            <input type="text" className="form-control" name="nom_professeur" value={form.nom_professeur} onChange={handleChange} required />
          </div>

          <div className="mb-3">
            <label className="form-label">Filières concernées</label>
            <div>
              {filieres
                .filter((f) => form.niveau === '1A' ? !f.est_3a : f.est_3a)
                .map((f) => (
                  <div className="form-check" key={f.id}>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`filiere-${f.id}`}
                      checked={form.filieres.includes(f.id)}
                      onChange={() => handleFiliereToggle(f.id)}
                    />
                    <label className="form-check-label" htmlFor={`filiere-${f.id}`}>
                      {`${f.nom_filiere} (${f.nom_departement})`}
                    </label>
                  </div>
                ))}
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Observations</label>
            <textarea className="form-control" name="observations" value={form.observations} onChange={handleChange} />
          </div>

          <button type="submit" className="btn btn-primary">Enregistrer la visite</button>
        </form>
      </div>
    </>
  );
}

