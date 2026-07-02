import { useState, useEffect, useRef } from 'react';
import Navbar from '../../components/Navbar';

export default function AdminDashboard() {
  const [adminName, setAdminName] = useState('Admin');
  const [adminData, setAdminData] = useState(null);
  const [eligiblesStats, setEligiblesStats] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [anneeImport, setAnneeImport] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const userType = localStorage.getItem('userType');
    const adminRole = localStorage.getItem('adminRole');

    if (userType !== 'admin') {
      window.location.href = '/login';
      return;
    }

    setAdminData({ ...userData, role: adminRole });
    if (userData?.email) {
      const emailName = userData.email.split('@')[0];
      const formattedName = emailName
        .split('.')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      setAdminName(formattedName);
    }
  }, []);

  useEffect(() => {
    if (!adminData) return;
    const token = localStorage.getItem('token');
    fetch('/api/admin/eligibles/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setEligiblesStats(data); })
      .catch(() => {});
  }, [adminData]);

  const calculerAnneeUniversitaire = () => {
    const maintenant = new Date();
    const annee = maintenant.getMonth() >= 8 ? maintenant.getFullYear() : maintenant.getFullYear() - 1;
    return `${annee}-${annee + 1}`;
  };

  const debutAnneeCourante = parseInt(calculerAnneeUniversitaire().split('-')[0], 10);
  const anneesDisponibles = [debutAnneeCourante - 1, debutAnneeCourante, debutAnneeCourante + 1, debutAnneeCourante + 2].map((a) => `${a}-${a + 1}`);

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportLoading(true);
    setImportResult(null);
    const formData = new FormData();
    formData.append('fichier', file);
    formData.append('annee', anneeImport);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/import-eligibles', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      setImportResult({ ok: res.ok, ...data });
    } catch {
      setImportResult({ ok: false, message: 'Erreur serveur' });
    } finally {
      setImportLoading(false);
      e.target.value = '';
    }
  };

  const cards = [
    {
      title: 'Saisir une visite',
      description: "Créer une nouvelle demande de visite d'entreprise.",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
      ),
      link: '/admins/visites',
    },
    {
      title: 'Suivi des visites',
      description: "Consulter et gérer les visites en cours et passées.",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
      link: '/admins/visite_suivi',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Navbar isLoggedIn={true} />

      <div style={{ paddingTop: '9rem', textAlign: 'center', marginBottom: '5rem' }}>
        <h1 style={{ color: '#002147', fontSize: '2.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>
          Gestion des visites
        </h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>
          Bienvenue {adminName} ! Choisissez une action ci-dessous.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2rem',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '0 1rem',
      }}>
        {cards.map((card, index) => (
          <div
            key={index}
            onClick={() => { window.location.href = card.link; }}
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(12px)',
              borderRadius: '18px',
              padding: '2rem',
              boxShadow: '0 10px 24px rgba(0, 0, 0, 0.08)',
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              border: '1px solid #e3e8ee',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: '1.2rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 16px 32px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 24px rgba(0, 0, 0, 0.08)';
            }}
          >
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#dceeff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#002147',
            }}>
              {card.icon}
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 600, color: '#002147' }}>
              {card.title}
            </h3>
            <p style={{ color: '#555', fontSize: '0.95rem', lineHeight: '1.4' }}>
              {card.description}
            </p>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: '600px', margin: '4rem auto 3rem', padding: '0 1rem' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 16px rgba(0,0,0,0.07)', border: '1px solid #e3e8ee' }}>
          <h3 style={{ color: '#002147', marginTop: 0, marginBottom: '0.5rem' }}>
            Mettre à jour la liste des étudiants
          </h3>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '1.5rem' }}>
            Importez le fichier Excel de la scolarité (une feuille par niveau : 1A, 2A, 3A). L'année est détectée automatiquement ou peut être forcée ci-dessous.
          </p>

          <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
            <label htmlFor="annee-import" style={{ display: 'block', marginBottom: '0.5rem', color: '#002147', fontWeight: 600, fontSize: '14px' }}>
              Année universitaire
            </label>
            <select
              id="annee-import"
              value={anneeImport}
              onChange={(e) => setAnneeImport(e.target.value)}
              disabled={importLoading}
              style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #ccc', fontSize: '15px', backgroundColor: '#fff' }}
            >
              <option value="">Automatique (détectée dans le fichier)</option>
              {anneesDisponibles.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {eligiblesStats.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontWeight: 600, color: '#002147', fontSize: '14px', marginBottom: '0.5rem' }}>
                Étudiants éligibles actuellement en base :
              </p>
              {Object.entries(
                eligiblesStats.reduce((acc, r) => {
                  if (!acc[r.annee_universitaire]) acc[r.annee_universitaire] = {};
                  acc[r.annee_universitaire][r.niveau] = r.total;
                  return acc;
                }, {})
              ).map(([annee, niveaux]) => (
                <div key={annee} style={{ fontSize: '13px', color: '#444', marginBottom: '0.3rem' }}>
                  <strong>{annee}</strong> — {['1A', '2A', '3A'].map((n) => niveaux[n] ? `${n} : ${niveaux[n]}` : null).filter(Boolean).join(' · ')}
                </div>
              ))}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImport}
            style={{ display: 'none' }}
          />

          <button
            onClick={() => fileInputRef.current.click()}
            disabled={importLoading}
            style={{
              width: '100%',
              padding: '0.85rem',
              backgroundColor: '#002147',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '15px',
              cursor: importLoading ? 'not-allowed' : 'pointer',
              opacity: importLoading ? 0.7 : 1,
            }}
          >
            {importLoading ? 'Import en cours...' : 'Choisir le fichier Excel'}
          </button>

          {importResult && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              borderRadius: '8px',
              backgroundColor: importResult.ok ? '#d4edda' : '#f8d7da',
              color: importResult.ok ? '#155724' : '#721c24',
              fontSize: '14px',
            }}>
              <strong>{importResult.message}</strong>
              {importResult.ok && importResult.stats && (
                <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.2rem' }}>
                  <li>{importResult.stats.inseres} nouveau(x) étudiant(s) ajouté(s)</li>
                  <li>{importResult.stats.mis_a_jour} mis à jour</li>
                  <li>{importResult.stats.ignores} ignoré(s) (email invalide)</li>
                  {importResult.stats.erreurs?.length > 0 && (
                    <li style={{ color: '#856404' }}>Avertissements : {importResult.stats.erreurs.join(', ')}</li>
                  )}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
