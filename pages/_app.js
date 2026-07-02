import { useEffect, useState } from "react";
import Router from "next/router";
import App from "next/app";
import Head from 'next/head';

import FooterSection from "@/components/footer-section";
import HeaderSection from "@/components/header-section";
import ScrollToButtonButton from "@/components/scroll-to-top-button";
import Preloader from "@/components/preloader";

import 'bootstrap/dist/css/bootstrap.css';
import '@/css/lineicons.css';
import '@/css/tiny-slider.min.css';
import '@/css/main.css';

function MyApp({ Component, pageProps }) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    import("bootstrap/dist/js/bootstrap.js");

    if (!window.__fetchPatched) {
      const fetchOrigine = window.fetch;

      window.fetch = (url, options = {}) => {
        const estApiBackend = typeof url === 'string' && (url.startsWith('/api/') || url.startsWith('http://localhost:4000'));
        const token = localStorage.getItem('token');

        if (estApiBackend && token) {
          options.headers = {
            ...options.headers,
            Authorization: `Bearer ${token}`,
          };
        }

        return fetchOrigine(url, options);
      };

      window.__fetchPatched = true;
    }

    const showLoader = () => setIsLoading(true);
    const hideLoader = () => setIsLoading(false);

    Router.events.on("routeChangeStart", showLoader);
    Router.events.on("routeChangeComplete", hideLoader);
    Router.events.on("routeChangeError", hideLoader);

    return () => {
      Router.events.off("routeChangeStart", showLoader);
      Router.events.off("routeChangeComplete", hideLoader);
      Router.events.off("routeChangeError", hideLoader);
    };
  }, []);

  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta httpEquiv="x-ua-compatible" content="ie=edge" />
        <title>Plateforme ENSMR</title>
        <meta name="description" content="Plateforme de gestion des stages ENSMR" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
      </Head>

      {isLoading && <Preloader />}

      {!isLoading && (
        <>
          <HeaderSection />
          <Component {...pageProps} />
          <FooterSection />
          <ScrollToButtonButton />
        </>
      )}
    </>
  );
}

// Supprimer complètement getInitialProps si tu n’utilises plus getMainMenu
MyApp.getInitialProps = async (appContext) => {
  const appProps = await App.getInitialProps(appContext);
  return { ...appProps };
};

export default MyApp;
