/**
 * lib/email/inviteEmailTemplate.ts
 * Generates responsive, high-fidelity HTML emails for CGI ENIT platform invitations.
 * Optimized for Gmail, Apple Mail, Outlook, and mobile devices.
 */

export interface InviteEmailOptions {
  email: string;
  role: string;
  inviteLink: string;
  duration?: number;
  appUrl?: string;
  senderName?: string;
}

interface RoleConfig {
  label: string;
  subtitle: string;
  badgeBg: string;
  badgeColor: string;
  badgeBorder: string;
  description: string;
  iconText: string;
}

export function getRoleConfig(role: string): RoleConfig {
  switch (role) {
    case "membre_bureau":
    case "bureau":
      return {
        label: "Membre du Bureau Exécutif",
        subtitle: "Administration & Pilotage",
        badgeBg: "rgba(52, 211, 153, 0.15)",
        badgeColor: "#34d399",
        badgeBorder: "rgba(52, 211, 153, 0.35)",
        description:
          "Vous rejoignez l'équipe dirigeante du Club Génie Industriel de l'ENIT. Vous aurez accès aux outils d'administration, de gestion des pôles et de coordination des événements.",
        iconText: "⚡",
      };
    case "senior":
    case "senior_member":
      return {
        label: "Membre Senior",
        subtitle: "2ème Année • Mentorat & Projets",
        badgeBg: "rgba(252, 163, 17, 0.15)",
        badgeColor: "#fca311",
        badgeBorder: "rgba(252, 163, 17, 0.35)",
        description:
          "Vous êtes invité(e) avec le statut de Membre Senior. Contribuez au mentorat des nouveaux étudiants, à la direction des projets industriels et aux actions avancées du club.",
        iconText: "🌟",
      };
    case "alumni":
      return {
        label: "Alumni • Réseau Diplômé",
        subtitle: "Communauté & Partage d'Expérience",
        badgeBg: "rgba(192, 132, 252, 0.15)",
        badgeColor: "#c084fc",
        badgeBorder: "rgba(192, 132, 252, 0.35)",
        description:
          "Bienvenue dans le cercle Alumni du Club Génie Industriel ENIT. Restez connecté avec votre club, partagez vos opportunités professionnelles et inspirez les prochaines promotions.",
        iconText: "🎓",
      };
    case "admin":
      return {
        label: "Administrateur Système",
        subtitle: "Accès Privilégié Global",
        badgeBg: "rgba(239, 68, 68, 0.15)",
        badgeColor: "#f87171",
        badgeBorder: "rgba(239, 68, 68, 0.35)",
        description:
          "Vous avez été désigné comme administrateur de la plateforme officielle du Club Génie Industriel de l'ENIT.",
        iconText: "🛡️",
      };
    case "membre_actif":
    default:
      return {
        label: "Membre Actif",
        subtitle: "1ère Année • Projets & Formations",
        badgeBg: "rgba(56, 189, 248, 0.15)",
        badgeColor: "#38bdf8",
        badgeBorder: "rgba(56, 189, 248, 0.35)",
        description:
          "Vous avez été officiellement sélectionné(e) pour rejoindre le Club Génie Industriel de l'ENIT. Participez aux visites d'usines, formations techniques, hackathons et accumulez des points d'engagement.",
        iconText: "🚀",
      };
  }
}

export function generateInviteEmailHtml(options: InviteEmailOptions): string {
  const { email, role, inviteLink, duration = 7, appUrl = "https://official-platform.clubgenieindustrielenit.org" } = options;
  const config = getRoleConfig(role);
  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="dark" />
    <meta name="supported-color-schemes" content="dark" />
    <title>Invitation Officielle — Club Génie Industriel ENIT</title>
    <!--[if mso]>
    <style type="text/css">
      body, table, td, a { font-family: Arial, sans-serif !important; }
    </style>
    <![endif]-->
  </head>
  <body style="margin: 0; padding: 0; background-color: #0b0d0e; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; line-height: 1.6;">
    <!-- Outer Wrapper Table -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0d0e; padding: 36px 12px;">
      <tr>
        <td align="center">
          <!-- Main Card Container -->
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background: linear-gradient(180deg, #14213d 0%, #0f172a 100%); border: 1px solid rgba(252, 163, 17, 0.25); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(252, 163, 17, 0.08);">
            
            <!-- Top Gold Accent Bar -->
            <tr>
              <td style="background: linear-gradient(90deg, #fca311 0%, #ffc887 50%, #fca311 100%); height: 4px; font-size: 0; line-height: 0;">&nbsp;</td>
            </tr>

            <!-- Header Section -->
            <tr>
              <td align="center" style="padding: 36px 32px 20px 32px;">
                <!-- Brand Badge -->
                <table border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background: rgba(252, 163, 17, 0.1); border: 1px solid rgba(252, 163, 17, 0.3); border-radius: 9999px; padding: 6px 16px;">
                      <span style="font-family: monospace; font-size: 11px; font-weight: 700; color: #fca311; letter-spacing: 2px; text-transform: uppercase;">
                        CGI ENIT • PORTAIL OFFICIEL
                      </span>
                    </td>
                  </tr>
                </table>

                <!-- Main Heading -->
                <h1 style="color: #ffffff; font-size: 26px; font-weight: 800; margin: 20px 0 6px 0; letter-spacing: -0.5px; text-transform: uppercase;">
                  Bienvenue au Club
                </h1>
                <p style="color: #94a3b8; font-size: 13px; margin: 0; font-family: monospace;">
                  École Nationale d'Ingénieurs de Tunis
                </p>
              </td>
            </tr>

            <!-- Content Card -->
            <tr>
              <td style="padding: 0 32px 32px 32px;">
                
                <!-- Greeting -->
                <p style="color: #cbd5e1; font-size: 14px; margin: 0 0 16px 0;">
                  Bonjour <strong style="color: #ffffff;">${email}</strong>,
                </p>
                <p style="color: #cbd5e1; font-size: 14px; margin: 0 0 24px 0; line-height: 1.6;">
                  Vous êtes cordialement invité(e) à activer votre compte sur la plateforme interne du <strong style="color: #fca311;">Club Génie Industriel</strong> de l'ENIT.
                </p>

                <!-- Dynamic Role Highlight Box -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b1120; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; margin-bottom: 28px; overflow: hidden;">
                  <tr>
                    <td style="padding: 20px;">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td>
                            <span style="font-size: 10px; font-family: monospace; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 6px;">
                              RÔLE ASSIGNÉ
                            </span>
                            <div style="display: inline-block; background: ${config.badgeBg}; border: 1px solid ${config.badgeBorder}; color: ${config.badgeColor}; font-weight: 800; font-size: 13px; padding: 5px 12px; border-radius: 8px; margin-bottom: 8px;">
                              ${config.iconText} ${config.label}
                            </div>
                            <p style="color: #94a3b8; font-size: 12px; margin: 6px 0 0 0; line-height: 1.5;">
                              ${config.description}
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Call to Action Button -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 28px;">
                  <tr>
                    <td align="center">
                      <a href="${inviteLink}" target="_blank" style="background: linear-gradient(135deg, #fca311 0%, #e59500 100%); color: #000000; font-weight: 800; font-size: 14px; text-decoration: none; padding: 15px 36px; border-radius: 12px; display: inline-block; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 8px 24px rgba(252, 163, 17, 0.35); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                        Finaliser mon compte &rarr;
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Validity & Details Box -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 20px;">
                  <tr>
                    <td>
                      <!-- Timer info -->
                      <p style="color: #94a3b8; font-size: 12px; margin: 0 0 12px 0;">
                        ⏳ <strong>Validité :</strong> Ce lien d'invitation sécurisé expire dans <span style="color: #fca311; font-weight: 700;">${duration} jours</span>.
                      </p>
                      
                      <!-- Fallback URL -->
                      <p style="color: #64748b; font-size: 11px; margin: 0 0 6px 0;">
                        Si le bouton ne s'ouvre pas, copiez ce lien directement :
                      </p>
                      <p style="margin: 0; font-size: 11px; font-family: monospace; background: rgba(0,0,0,0.3); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); word-break: break-all;">
                        <a href="${inviteLink}" style="color: #fca311; text-decoration: underline;">${inviteLink}</a>
                      </p>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color: #07090e; border-top: 1px solid rgba(255, 255, 255, 0.06); padding: 24px 32px; text-align: center;">
                <p style="color: #64748b; font-size: 11px; margin: 0 0 6px 0;">
                  Cet e-mail est destiné uniquement à <span style="color: #94a3b8;">${email}</span>.<br/>Ne le partagez pas avec des tiers.
                </p>
                <p style="color: #475569; font-size: 10px; margin: 0; font-family: monospace; text-transform: uppercase; letter-spacing: 1px;">
                  © ${currentYear} Club Génie Industriel — ENIT • Live Your Best Experiences
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
