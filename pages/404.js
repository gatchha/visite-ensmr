import Image from "next/image";

export default function Custom404() {
  return (
    <section id="home" className="hero-section">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-xl-6 col-lg-6 col-md-10">
            <div className="hero-content">
              <h1>404 Page not found</h1>
              <p>
                La page demandée est introuvable ou l'URL est invalide.
              </p>
            </div>
          </div>
          <div className="col-xxl-6 col-xl-6 col-lg-6">
            
            <div className="hero-image text-center text-lg-end"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
