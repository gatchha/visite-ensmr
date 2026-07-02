import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';

export default function AdminProfil() {
  const router = useRouter();
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Password change form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🆕 État pour les exigences du mot de passe
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    letter: false,
    number: false,
    special: false
  });

  useEffect(() => {
    const userType = localStorage.getItem('userType');
    if (userType !== 'admin') {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const adminRole = localStorage.getItem('adminRole');
    setAdminData({ ...userData, role: adminRole });
    setLoading(false);
  }, [router]);

  // 🆕 Vérifier les exigences en temps réel
  useEffect(() => {
    if (newPassword) {
      setPasswordRequirements({
        length: newPassword.length >= 8,
        letter: /[a-zA-Z]/.test(newPassword),
        number: /\d/.test(newPassword),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)
      });
    } else {
      setPasswordRequirements({
        length: false,
        letter: false,
        number: false,
        special: false
      });
    }
  }, [newPassword]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // 🆕 Validation frontend améliorée
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Tous les champs sont obligatoires');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (!/[a-zA-Z]/.test(newPassword)) {
      setPasswordError('Le mot de passe doit contenir au moins une lettre');
      return;
    }

    if (!/\d/.test(newPassword)) {
      setPasswordError('Le mot de passe doit contenir au moins un chiffre');
      return;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      setPasswordError('Le mot de passe doit contenir au moins un caractère spécial');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admins/${adminData.id}/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // 🆕 Si le backend renvoie plusieurs erreurs
        if (data.errors && Array.isArray(data.errors)) {
          setPasswordError(data.errors.join('. '));
        } else {
          setPasswordError(data.message || 'Erreur lors du changement de mot de passe');
        }
      } else {
        setPasswordSuccess('Mot de passe modifié avec succès');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      setPasswordError('Erreur de connexion au serveur');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Navbar isLoggedIn={true} />

      <div style={{ paddingTop: '7rem', maxWidth: '1100px', margin: '0 auto', padding: '7rem 2rem 2rem' }}>
        <h1 style={{
          color: '#002147',
          fontSize: '2rem',
          fontWeight: '700',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          Mon Profil
        </h1>

        {/* Info Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          borderRadius: '18px',
          padding: '2rem',
          boxShadow: '0 10px 24px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e3e8ee',
          marginBottom: '2rem'
        }}>
          <h2 style={{ color: '#002147', fontSize: '1.3rem', marginBottom: '1.5rem', fontWeight: '600' }}>
            Informations personnelles
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem 2rem' }}>
            <div>
              <label style={{ color: '#666', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Nom</label>
              <p style={{ color: '#002147', fontSize: '1.1rem', fontWeight: '500', margin: 0 }}>
                {adminData?.nom || '-'}
              </p>
            </div>

            <div>
              <label style={{ color: '#666', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Prénom</label>
              <p style={{ color: '#002147', fontSize: '1.1rem', fontWeight: '500', margin: 0 }}>
                {adminData?.prenom || '-'}
              </p>
            </div>

            <div>
              <label style={{ color: '#666', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Email</label>
              <p style={{ color: '#002147', fontSize: '1.1rem', fontWeight: '500', margin: 0, wordBreak: 'break-word' }}>
                {adminData?.email || '-'}
              </p>
            </div>

            <div>
              <label style={{ color: '#666', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Rôle</label>
              <p style={{ color: '#002147', fontSize: '1.1rem', fontWeight: '500', margin: 0 }}>
                {adminData?.role === 'principal' ? 'Administrateur (service de stage)' : 'Chef de département / Chef de filière'}
              </p>
            </div>

            {adminData?.departement && (
              <div>
                <label style={{ color: '#666', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Département</label>
                <p style={{ color: '#002147', fontSize: '1.1rem', fontWeight: '500', margin: 0 }}>
                  {adminData.departement}
                </p>
              </div>
            )}

            {adminData?.filiere && (
              <div>
                <label style={{ color: '#666', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Filière</label>
                <p style={{ color: '#002147', fontSize: '1.1rem', fontWeight: '500', margin: 0 }}>
                  {adminData.filiere}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Password Change Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          borderRadius: '18px',
          padding: '2rem',
          boxShadow: '0 10px 24px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e3e8ee'
        }}>
          <h2 style={{ color: '#002147', fontSize: '1.3rem', marginBottom: '1.5rem', fontWeight: '600' }}>
            Changer le mot de passe
          </h2>

          <form onSubmit={handlePasswordChange}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: '#666', fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>
                Mot de passe actuel
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#002147'}
                onBlur={(e) => e.target.style.borderColor = '#ddd'}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: '#666', fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>
                Nouveau mot de passe
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#002147'}
                onBlur={(e) => e.target.style.borderColor = '#ddd'}
              />
              
              {/* 🆕 Indicateur des exigences */}
              {newPassword && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600', color: '#002147' }}>
                    Exigences du mot de passe :
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: passwordRequirements.length ? '#28a745' : '#dc3545', fontSize: '1.2rem' }}>
                        {passwordRequirements.length ? '✓' : '✗'}
                      </span>
                      <span style={{ color: passwordRequirements.length ? '#28a745' : '#666' }}>
                        Au moins 8 caractères
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: passwordRequirements.letter ? '#28a745' : '#dc3545', fontSize: '1.2rem' }}>
                        {passwordRequirements.letter ? '✓' : '✗'}
                      </span>
                      <span style={{ color: passwordRequirements.letter ? '#28a745' : '#666' }}>
                        Au moins une lettre (a-z, A-Z)
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: passwordRequirements.number ? '#28a745' : '#dc3545', fontSize: '1.2rem' }}>
                        {passwordRequirements.number ? '✓' : '✗'}
                      </span>
                      <span style={{ color: passwordRequirements.number ? '#28a745' : '#666' }}>
                        Au moins un chiffre (0-9)
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: passwordRequirements.special ? '#28a745' : '#dc3545', fontSize: '1.2rem' }}>
                        {passwordRequirements.special ? '✓' : '✗'}
                      </span>
                      <span style={{ color: passwordRequirements.special ? '#28a745' : '#666' }}>
                        Au moins un caractère spécial (!@#$%...)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ color: '#666', fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>
                Confirmer le nouveau mot de passe
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#002147'}
                onBlur={(e) => e.target.style.borderColor = '#ddd'}
              />
            </div>

            {passwordError && (
              <div style={{
                backgroundColor: '#f8d7da',
                color: '#721c24',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.9rem'
              }}>
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div style={{
                backgroundColor: '#d4edda',
                color: '#155724',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.9rem'
              }}>
                {passwordSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                backgroundColor: isSubmitting ? '#666' : '#002147',
                color: '#ffffff',
                border: 'none',
                padding: '0.75rem 2rem',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => { if (!isSubmitting) e.target.style.backgroundColor = '#003366'; }}
              onMouseLeave={(e) => { if (!isSubmitting) e.target.style.backgroundColor = '#002147'; }}
            >
              {isSubmitting ? 'Modification en cours...' : 'Modifier le mot de passe'}
            </button>
          </form>
        </div>

        {/* Back Button */}
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            onClick={() => router.push('/admins/dashboard')}
            style={{
              backgroundColor: 'transparent',
              color: '#002147',
              border: '2px solid #002147',
              padding: '0.75rem 2rem',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#002147';
              e.target.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#002147';
            }}
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    </div>
  );
}