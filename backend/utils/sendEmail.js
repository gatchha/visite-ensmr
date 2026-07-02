const nodemailer = require('nodemailer');


const createTransporter = () => {
  if (!process.env.EMAIL_USER) {
    throw new Error('Variable EMAIL_USER manquante dans .env');
  }

  if (!process.env.EMAIL_PASSWORD) {
    throw new Error('Variable EMAIL_PASSWORD manquante dans .env');
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

const sendStageValidationEmail = async (studentInfo) => {
  try {
    if (!studentInfo || !studentInfo.email) {
      throw new Error('Email étudiant manquant');
    }

    if (!studentInfo.nom || !studentInfo.prenom) {
      throw new Error('Nom ou prénom étudiant manquant');
    }

    console.log("Préparation email validation pour:", {
      email: studentInfo.email,
      nom: studentInfo.nom,
      prenom: studentInfo.prenom
    });

    const transporter = createTransporter();
    
    const emailContent = {
      from: `"Service des Stages"<${process.env.EMAIL_USER}>`,
      to: studentInfo.email,
      subject: 'Demande de convention validée',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #002147;">Demande de convention validée</h2>
          <p>Cher(e) <strong>${studentInfo.prenom} ${studentInfo.nom}</strong>,</p>
          <p>Votre demande de convention a été <strong>validée</strong> avec succès.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #002147; margin-top: 0;">Détails du stage :</h3>
            <p><strong>Entreprise :</strong> ${studentInfo.organisme_nom || 'Non spécifiée'}</p>
            <p><strong>Période :</strong> ${formatDate(studentInfo.date_debut)} → ${formatDate(studentInfo.date_fin)}</p>
            <p><strong>Sujet :</strong> ${studentInfo.sujet_stage || 'Non spécifié'}</p>
          </div>
          
          <p>Vous pouvez maintenant télécharger votre convention depuis votre espace étudiant.</p>
          <p>Bon stage !<br><strong>Service des Stages - ENSMR</strong></p>
        </div>
      `,
      text: `
        Demande de convention validée
        
        Cher(e) ${studentInfo.prenom} ${studentInfo.nom},
        
        Votre demande de convention a été validée avec succès.
        
        Détails du stage :
        - Entreprise : ${studentInfo.organisme_nom || 'Non spécifiée'}
        - Période : ${formatDate(studentInfo.date_debut)} → ${formatDate(studentInfo.date_fin)}
        - Sujet : ${studentInfo.sujet_stage || 'Non spécifié'}
        
        Vous pouvez maintenant télécharger votre convention depuis votre espace étudiant.
        
        Bon stage !
        Service des Stages - ENSMR
      `
    };

    console.log("Envoi email en cours...");
    const result = await transporter.sendMail(emailContent);
    console.log("Email de validation envoyé avec succès!");
    console.log("- Message ID:", result.messageId);
    console.log("- Response:", result.response);
    
    return {
      success: true,
      messageId: result.messageId,
      response: result.response
    };

  } catch (error) {
    console.error("Erreur envoi email validation:");
    console.error("- Message:", error.message);
    console.error("- Code:", error.code);
    console.error("- Stack:", error.stack);
    throw error;
  }
};

const sendStageRejectionEmail = async (studentInfo) => {
  try {
    if (!studentInfo || !studentInfo.email) {
      throw new Error('Email étudiant manquant');
    }

    if (!studentInfo.nom || !studentInfo.prenom) {
      throw new Error('Nom ou prénom étudiant manquant');
    }

    console.log("Préparation email refus pour:", {
      email: studentInfo.email,
      nom: studentInfo.nom,
      prenom: studentInfo.prenom
    });

    const transporter = createTransporter();
    
    const emailContent = {
      from: `"Service des Stages"<${process.env.EMAIL_USER}>`,
      to: studentInfo.email,
      subject: 'Convention de stage - Demande non acceptée',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">Demande de convention de stage</h2>
          <p>Cher(e) <strong>${studentInfo.prenom} ${studentInfo.nom}</strong>,</p>
          <p>Nous vous informons que votre demande de convention de stage n'a pas été acceptée.</p>
          
          <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <h3 style="color: #721c24; margin-top: 0;">Demande concernée :</h3>
            <p><strong>Entreprise :</strong> ${studentInfo.organisme_nom || 'Non spécifiée'}</p>
            <p><strong>Période :</strong> ${formatDate(studentInfo.date_debut)} → ${formatDate(studentInfo.date_fin)}</p>
            <p><strong>Sujet :</strong> ${studentInfo.sujet_stage || 'Non spécifié'}</p>
          </div>
          
          <p>Pour plus d'informations, veuillez contacter le service des stages.</p>
          <p>Très cordialement,<br><strong>Service des Stages - ENSMR</strong></p>
        </div>
      `,
      text: `
        Demande de convention de stage
        
        Cher(e) ${studentInfo.prenom} ${studentInfo.nom},
        
        Nous vous informons que votre demande de convention de stage n'a pas été acceptée.
        
        Demande concernée :
        - Entreprise : ${studentInfo.organisme_nom || 'Non spécifiée'}
        - Période : ${formatDate(studentInfo.date_debut)} → ${formatDate(studentInfo.date_fin)}
        - Sujet : ${studentInfo.sujet_stage || 'Non spécifié'}
        
        Pour plus d'informations, veuillez contacter le service des stages.
        
        Très cordialement,
        Service des Stages - ENSMR
      `
    };

    console.log("Envoi email en cours...");
    const result = await transporter.sendMail(emailContent);
    console.log("Email de refus envoyé avec succès!");
    console.log("- Message ID:", result.messageId);
    console.log("- Response:", result.response);
    
    return {
      success: true,
      messageId: result.messageId,
      response: result.response
    };

  } catch (error) {
    console.error("Erreur envoi email refus:");
    console.error("- Message:", error.message);
    console.error("- Code:", error.code);
    console.error("- Stack:", error.stack);
    throw error;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'Non spécifiée';
  try {
    return new Date(dateString).toLocaleDateString("fr-FR");
  } catch (error) {
    console.warn("Erreur formatage date:", dateString);
    return dateString;
  }
};

const sendEmail = async (to, subject, htmlContent, textContent = '', attachments = []) => {
  try {
    if (!to) {
      throw new Error('Adresse email destinataire manquante');
    }

    const transporter = createTransporter();

    const result = await transporter.sendMail({
      from: `"Service des Stages - ENSMR"<${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: textContent,
      html: htmlContent,
      attachments,
    });

    console.log("Email envoyé avec succès à:", to, "- Message ID:", result.messageId);
    return { success: true, messageId: result.messageId };

  } catch (error) {
    console.error("Erreur envoi email à:", to, "-", error.message);
    throw error;
  }
};

const testEmailConfiguration = async () => {
  try {
    const transporter = createTransporter();
    const verified = await transporter.verify();
    console.log("Configuration email vérifiée:", verified);
    return verified;
  } catch (error) {
    console.error("Erreur configuration email:", error.message);
    return false;
  }
};


const sendAvisPedagogiqueEmailToStudent = async (studentInfo, adminSecondaireInfo) => {
  try {
    if (!studentInfo || !studentInfo.email) {
      throw new Error('Email étudiant manquant');
    }

    if (!studentInfo.nom || !studentInfo.prenom) {
      throw new Error('Nom ou prénom étudiant manquant');
    }

    if (!studentInfo.avis || !['valide', 'refuse'].includes(studentInfo.avis)) {
      throw new Error('Avis pédagogique invalide');
    }

    if (!adminSecondaireInfo || !adminSecondaireInfo.nom || !adminSecondaireInfo.prenom) {
      throw new Error('Informations admin secondaire manquantes');
    }

    console.log("Préparation email avis pédagogique pour étudiant:", {
      email: studentInfo.email,
      etudiant: `${studentInfo.prenom} ${studentInfo.nom}`,
      avis: studentInfo.avis,
      adminSecondaire: `${adminSecondaireInfo.prenom} ${adminSecondaireInfo.nom}`,
      departement: studentInfo.departement
    });

    const transporter = createTransporter();
    
    const isFavorable = studentInfo.avis === 'valide';
    const avisText = isFavorable ? 'favorable': 'défavorable';
    const couleurAvis = isFavorable ? '#155724': '#721c24';
    const bgAvis = isFavorable ? '#d4edda': '#f8d7da';

    const nomDepartement = studentInfo.departement || 'Département';
    const nomAdminSecondaire = `${adminSecondaireInfo.prenom} ${adminSecondaireInfo.nom}`;

    const emailContent = {
      from: `"${nomAdminSecondaire} - Département ${nomDepartement}"<${process.env.EMAIL_USER}>`,
      to: studentInfo.email,
      subject: `Avis pédagogique ${avisText} - Demande de convention`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #002147;">Avis pédagogique sur votre demande de convention</h2>
          <p>Cher(e) <strong>${studentInfo.prenom} ${studentInfo.nom}</strong>,</p>
          <p>Votre demande de convention de stage a fait l'objet d'une évaluation pédagogique.</p>
          
          <div style="background-color: ${bgAvis}; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${couleurAvis};">
            <h3 style="color: ${couleurAvis}; margin-top: 0;">Avis pédagogique : ${avisText.toUpperCase()}</h3>
            <p><strong>Entreprise :</strong> ${studentInfo.organisme_nom || 'Non spécifiée'}</p>
            <p><strong>Période :</strong> ${formatDate(studentInfo.date_debut)} → ${formatDate(studentInfo.date_fin)}</p>
            <p><strong>Sujet :</strong> ${studentInfo.sujet_stage || 'Non spécifié'}</p>
            <p><strong>Département :</strong> ${nomDepartement}</p>
          </div>
          
          ${studentInfo.commentaire ? `
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #495057;">Commentaire pédagogique :</h4>
              <p style="margin: 0; line-height: 1.5;">${studentInfo.commentaire}</p>
            </div>
          `: ''}
          
          
          <p>Cordialement,<br>
          <strong>${nomAdminSecondaire}</strong><br>
          </p>
        </div>
      `,
      text: `
        Avis pédagogique sur votre demande de convention
        
        Cher(e) ${studentInfo.prenom} ${studentInfo.nom},
        
        Votre demande de convention de stage a fait l'objet d'une évaluation pédagogique.
        
        Avis pédagogique : ${avisText.toUpperCase()}
        
        Détails du stage :
        - Entreprise : ${studentInfo.organisme_nom || 'Non spécifiée'}
        - Période : ${formatDate(studentInfo.date_debut)} → ${formatDate(studentInfo.date_fin)}
        - Sujet : ${studentInfo.sujet_stage || 'Non spécifié'}
        - Département : ${nomDepartement}
        
        ${studentInfo.commentaire ? `Commentaire pédagogique :\n${studentInfo.commentaire}\n`: ''}
        
        
        Cordialement,
        ${nomAdminSecondaire}
        
      `
    };

    console.log("Envoi email avis pédagogique étudiant en cours...");
    const result = await transporter.sendMail(emailContent);
    console.log("Email avis pédagogique étudiant envoyé avec succès!");
    console.log("- Message ID:", result.messageId);
    
    return {
      success: true,
      messageId: result.messageId,
      response: result.response
    };

  } catch (error) {
    console.error("Erreur envoi email avis pédagogique étudiant:");
    console.error("- Message:", error.message);
    throw error;
  }
};


const sendVerificationEmail = async (email, nom, prenom, otpCode) => {
  try {
    if (!email || !otpCode) throw new Error('Email et code OTP requis');

    const transporter = createTransporter();

    const emailContent = {
      from: `"Plateforme de Stages - ENSMR"<${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Code de vérification de votre compte - ENSMR',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #002147; text-align:center; margin-top:0;">Vérification de votre compte</h2>
            <p>Bonjour <strong>${prenom} ${nom}</strong>,</p>
            <p>Voici votre code de vérification à 6 chiffres :</p>
            <div style="text-align:center; margin: 30px 0;">
              <span style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #002147; background:#e3f2fd; padding: 16px 24px; border-radius: 8px; display:inline-block;">${otpCode}</span>
            </div>
            <div style="background-color: #fff3cd; padding: 12px; border-radius: 5px; border-left: 4px solid #ffc107; margin-bottom: 16px;">
              <p style="margin: 0; font-size: 14px; color: #856404;">Ce code est valide pendant <strong>24 heures</strong>. Ne le partagez pas.</p>
            </div>
            <p style="color: #6c757d; font-size: 13px;">Si vous n'avez pas créé ce compte, ignorez cet email.</p>
          </div>
        </div>
      `,
      text: `Votre code de vérification ENSMR : ${otpCode}\n\nValide 24 heures.`
    };

    const result = await transporter.sendMail(emailContent);
    console.log("Email OTP vérification envoyé à:", email);
    return { success: true, messageId: result.messageId };

  } catch (error) {
    console.error("Erreur envoi email vérification:", error.message);
    throw error;
  }
};


const sendResetPasswordEmail = async (email, nom, prenom, resetToken) => {
  try {
  
    if (!email || !resetToken) {
      throw new Error('Email et token de réinitialisation requis');
    }

    console.log("Préparation email réinitialisation pour:", { email, nom, prenom });

    const transporter = createTransporter(); 
    
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    const mailOptions = {
      from: `"Service des Stages - ENSMR"<${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Réinitialisation de votre mot de passe - Plateforme de gestion des stages ENSMR',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #002147 0%, #004080 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #002147; color: white !important; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1> Réinitialisation de mot de passe</h1>
            </div>
            <div class="content">
              <p>Bonjour <strong>${prenom} ${nom}</strong>,</p>
              
              <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte sur la plateforme de gestion des stages de l'ENSMR.</p>
              
              <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}"class="button">Réinitialiser mon mot de passe</a>
              </div>
              
              <p>Ou copiez-collez ce lien dans votre navigateur :</p>
              <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 5px; font-size: 12px;">
                ${resetUrl}
              </p>
              
              <div class="warning">
                <strong>Important :</strong>
                <ul>
                  <li>Ce lien est valable pendant <strong>1 heure</strong></li>
                  <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
                  <li>Ne partagez jamais ce lien avec personne</li>
                </ul>
              </div>
              
              <p>Si le lien ne fonctionne pas, vous pouvez en demander un nouveau sur la page de connexion.</p>
              
              <p>Cordialement,<br>

            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Réinitialisation de votre mot de passe - Plateforme de gestion des stages ENSMR
        
        Bonjour ${prenom} ${nom},
        
        Vous avez demandé la réinitialisation de votre mot de passe pour votre compte sur la plateforme de gestion des stages de l'ENIM.
        
        Pour créer un nouveau mot de passe, cliquez sur le lien suivant :
        ${resetUrl}
        
        Important :
        - Ce lien est valable pendant 1 heure
        - Si vous n'avez pas demandé cette réinitialisation, ignorez cet email
        - Ne partagez jamais ce lien avec personne
        
        Si le lien ne fonctionne pas, vous pouvez en demander un nouveau sur la page de connexion.
        
        Cordialement,
      
      `
    };

    console.log("Envoi email réinitialisation en cours...");
    const result = await transporter.sendMail(mailOptions);
    console.log("Email de réinitialisation envoyé avec succès!");
    console.log("- Message ID:", result.messageId);
    
    return {
      success: true,
      messageId: result.messageId,
      response: result.response
    };

  } catch (error) {
    console.error('Erreur envoi email réinitialisation:', error);
    console.error("- Message:", error.message);
    console.error("- Stack:", error.stack);
    throw error;
  }
};


const sendAdminResetPasswordEmail = async (email, nom, prenom, resetToken) => {
  try {
    if (!email || !resetToken) throw new Error('Email et token requis');

    const transporter = createTransporter();
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admins/reset-password/${resetToken}`;

    const emailContent = {
      from: `"Plateforme de Stages - ENSMR"<${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Réinitialisation de votre mot de passe administrateur - ENSMR',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #002147; text-align:center; margin-top:0;">Réinitialisation du mot de passe</h2>
            <p>Bonjour <strong>${prenom} ${nom}</strong>,</p>
            <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe pour votre compte administrateur :</p>
            <div style="text-align:center; margin: 30px 0;">
              <a href="${resetUrl}"style="background-color:#002147; color:white; padding:14px 32px; text-decoration:none; border-radius:6px; font-weight:bold; display:inline-block;">
                Réinitialiser mon mot de passe
              </a>
            </div>
            <div style="background-color:#fff3cd; padding:12px; border-radius:5px; border-left:4px solid #ffc107; margin-bottom:16px;">
              <p style="margin:0; font-size:14px; color:#856404;">Ce lien est valide pendant <strong>1 heure</strong>. Ne le partagez pas.</p>
            </div>
            <p style="color:#6c757d; font-size:13px; word-break:break-all;">Lien : <a href="${resetUrl}"style="color:#002147;">${resetUrl}</a></p>
            <p style="color:#6c757d; font-size:13px;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
          </div>
        </div>
      `,
      text: `Réinitialisation mot de passe ENSMR :\n${resetUrl}\n\nValide 1 heure.`
    };

    const result = await transporter.sendMail(emailContent);
    console.log("Email reset admin envoyé à:", email);
    return { success: true, messageId: result.messageId };

  } catch (error) {
    console.error("Erreur envoi email reset admin:", error.message);
    throw error;
  }
};

module.exports = {
  sendStageValidationEmail,
  sendStageRejectionEmail,
  sendAvisPedagogiqueEmailToStudent,
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendAdminResetPasswordEmail,
  sendEmail,
  testEmailConfiguration
};