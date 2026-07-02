import { useState } from 'react';
import { useRouter } from 'next/router';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    if (!email) {
      setError('Veuillez entrer votre email');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Erreur lors de l'envoi");
      } else {
        setMessage(data.message);
        setEmail('');
      }
    } catch {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '18px',
        padding: '3rem',
        boxShadow: '0 10px 24px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e3e8ee',
        maxWidth: '500px',
        width: '100%',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#002147', fontSize: '1.8rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            Mot de passe oublié ?
          </h1>
          <p style={{ color: '#666', fontSize: '0.95rem' }}>
            Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ color: '#666', fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Email institutionnel
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="prenom.nom@enim.ac.ma"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '1rem',
                boxSizing: 'border-box',
                backgroundColor: loading ? '#f5f5f5' : '#fff',
              }}
            />
          </div>

          {error && (
            <div style={{ backgroundColor: '#fee', color: '#c33', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', borderLeft: '4px solid #c33' }}>
              {error}
            </div>
          )}

          {message && (
            <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', borderLeft: '4px solid #28a745' }}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: loading ? '#666' : '#002147',
              color: '#ffffff',
              border: 'none',
              padding: '0.85rem',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '1rem',
            }}
          >
            {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={() => router.push('/login')}
              style={{ background: 'none', border: 'none', color: '#002147', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              ← Retour à la connexion
            </button>
          </div>
        </form>

        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f7ff', borderRadius: '8px', fontSize: '0.85rem', color: '#666' }}>
          <strong style={{ color: '#002147' }}>Remarque :</strong> Le lien de réinitialisation sera valable pendant 1 heure. Si vous ne recevez pas l'email, vérifiez vos spams.
        </div>
      </div>
    </div>
  );
}
