import { useEffect } from "react";
import Head from 'next/head';
import 'bootstrap/dist/css/bootstrap.css';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    import("bootstrap/dist/js/bootstrap.js");

    if (!window.__fetchPatched) {
      const fetchOrigine = window.fetch;
      window.fetch = (url, options = {}) => {
        const estApiBackend = typeof url === 'string' && (url.startsWith('/api/') || url.startsWith('http://localhost:4000'));
        const token = localStorage.getItem('token');
        if (estApiBackend && token) {
          options.headers = { ...options.headers, Authorization: `Bearer ${token}` };
        }
        return fetchOrigine(url, options);
      };
      window.__fetchPatched = true;
    }
  }, []);

  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Gestion des visites — ENSMR</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
