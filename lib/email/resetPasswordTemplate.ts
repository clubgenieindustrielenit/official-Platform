/**
 * lib/email/resetPasswordTemplate.ts
 * Generates responsive, branded HTML email for CGI ENIT password reset.
 */

export interface ResetPasswordEmailOptions {
  email: string;
  resetLink: string;
  appUrl?: string;
}

export function generateResetPasswordEmailHtml(options: ResetPasswordEmailOptions): string {
  const { email, resetLink, appUrl = "https://clubgenieindustrielenit.org" } = options;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Réinitialisation de votre mot de passe — CGI ENIT</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f1117; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f1117; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #1a1d26; border: 1px solid #2d3748; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; text-align: center; background: linear-gradient(180deg, rgba(252, 163, 17, 0.08) 0%, transparent 100%);">
              <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 16px; background-color: rgba(252, 163, 17, 0.15); border: 1px solid rgba(252, 163, 17, 0.3); font-size: 26px;">
                🔑
              </div>
              <h1 style="margin: 16px 0 6px 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">
                Club Génie Industriel ENIT
              </h1>
              <p style="margin: 0; color: #fca311; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                Réinitialisation de mot de passe
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 10px 32px 32px 32px;">
              <p style="margin: 0 0 16px 0; color: #cbd5e1; font-size: 14px; line-height: 1.6;">
                Bonjour <strong style="color: #ffffff;">${email}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">
                Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte sur la plateforme officielle du <strong>Club Génie Industriel ENIT</strong>.
              </p>

              <!-- Action Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" style="display: inline-block; background-color: #fca311; color: #000000; font-weight: 700; font-size: 15px; text-decoration: none; padding: 14px 36px; border-radius: 12px; box-shadow: 0 6px 20px rgba(252, 163, 17, 0.35);">
                      Réinitialiser mon mot de passe →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0 0; color: #64748b; font-size: 12px; line-height: 1.5; text-align: center;">
                Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité. Votre mot de passe actuel restera inchangé.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #14161f; border-top: 1px solid #242b3d; text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 11px;">
                © ${new Date().getFullYear()} Club Génie Industriel • École Nationale d'Ingénieurs de Tunis
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
