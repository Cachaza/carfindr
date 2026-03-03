package notifier

import (
	"context"
	"fmt"
	"log"

	"github.com/cachaza/searchNotifier/internal/models" // Para struct User
	"github.com/resend/resend-go/v2"
)

// Notifier define la interfaz para enviar notificaciones.
type Notifier interface {
	SendNotificationEmail(ctx context.Context, recipient *models.User, savedSearch models.SavedSearch, newCarsCount int) error
}

type EmailNotifier struct {
	resendClient *resend.Client
	fromAddress  string
}

func NewEmailNotifier(apiKey string, fromAddress string) Notifier {
	client := resend.NewClient(apiKey)
	return &EmailNotifier{resendClient: client, fromAddress: fromAddress}
}

func (n *EmailNotifier) SendNotificationEmail(ctx context.Context, recipient *models.User, savedSearch models.SavedSearch, newCarsCount int) error {
	if recipient == nil || recipient.Email == "" {
		return fmt.Errorf("no se puede enviar email: destinatario o email del destinatario faltante")
	}
	if newCarsCount == 0 {
		log.Println("No hay coches nuevos para notificar, saltando email.")
		return nil
	}

	// Obtener nombre de usuario de forma segura
	userName := "Usuario" // Valor por defecto
	if recipient.Name != nil {
		userName = *recipient.Name
	}

	// Obtener nombre de búsqueda de forma segura
	searchName := "tu búsqueda"
	if savedSearch.Name != nil {
		searchName = fmt.Sprintf("\"%s\"", *savedSearch.Name)
	}

	subject := "¡Nuevos coches encontrados!"

	// Versión de texto plano
	plainTextBody := fmt.Sprintf(`Hola %s,

¡Tenemos buenas noticias! Hemos encontrado %d nuevos coches que coinciden con %s.

Visita CarFindr para ver todos los detalles y explorar tus nuevas opciones:
https://carfindr.cachaza.cc

Saludos cordiales,
El equipo de CarFindr`, userName, newCarsCount, searchName)

	// Versión HTML con estilos hermosos
	htmlBody := fmt.Sprintf(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nuevos coches encontrados</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; color: #0f172a;">
    <table role="presentation" style="width: 100%%; background-color: #ffffff;">
        <tr>
            <td style="padding: 0;">
                <!-- Header -->
                <table role="presentation" style="width: 100%%; max-width: 600px; margin: 0 auto; background-color: #3b82f6; border-radius: 16px 16px 0 0;">
                    <tr>
                        <td style="padding: 40px 32px; text-align: center;">
                            <h1 style="margin: 0; color: #f8fafc; font-size: 28px; font-weight: 700; line-height: 1.2;">
                                🚗 CarFindr
                            </h1>
                            <p style="margin: 8px 0 0 0; color: #e2e8f0; font-size: 16px; opacity: 0.9;">
                                Tu buscador de coches inteligente
                            </p>
                        </td>
                    </tr>
                </table>

                <!-- Main Content -->
                <table role="presentation" style="width: 100%%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 0 0 16px 16px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);">
                    <tr>
                        <td style="padding: 48px 32px;">
                            <!-- Greeting -->
                            <h2 style="margin: 0 0 24px 0; color: #0f172a; font-size: 24px; font-weight: 600; line-height: 1.3;">
                                ¡Hola %s! 👋
                            </h2>
                            
                            <!-- Main Message -->
                            <div style="background-color: #f1f5f9; border-radius: 12px; padding: 32px; margin-bottom: 32px; border-left: 4px solid #3b82f6;">
                                <div style="text-align: center; margin-bottom: 20px;">
                                    <div style="width: 80px; height: 80px; background-color: #3b82f6; border-radius: 50%%; margin: 0 auto 16px auto; display: flex; align-items: center; justify-content: center; font-size: 36px;">
                                        🎉
                                    </div>
                                </div>
                                <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 20px; font-weight: 600; text-align: center;">
                                    ¡Tenemos buenas noticias!
                                </h3>
                                <p style="margin: 0 0 16px 0; color: #475569; font-size: 16px; line-height: 1.6; text-align: center;">
                                    Hemos encontrado <strong style="color: #3b82f6;">%d nuevos coches</strong> que coinciden con %s.
                                </p>
                                <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.5; text-align: center;">
                                    No pierdas la oportunidad de encontrar tu coche ideal.
                                </p>
                            </div>

                            <!-- Call to Action -->
                            <div style="text-align: center; margin-bottom: 32px;">
                                <a href="https://carfindr.cachaza.cc" 
                                   style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);">
                                    🔍 Ver coches nuevos
                                </a>
                            </div>

                            <!-- Additional Info -->
                            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                                <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.5; text-align: center;">
                                    💡 <strong>Consejo:</strong> Los mejores coches se van rápido. Te recomendamos revisar los nuevos resultados lo antes posible.
                                </p>
                            </div>

                            <!-- Footer Message -->
                            <p style="margin: 0 0 8px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                                Saludos cordiales,
                            </p>
                            <p style="margin: 0; color: #3b82f6; font-size: 16px; font-weight: 600;">
                                El equipo de CarFindr
                            </p>
                        </td>
                    </tr>
                </table>

                <!-- Footer -->
                <table role="presentation" style="width: 100%%; max-width: 600px; margin: 0 auto;">
                    <tr>
                        <td style="padding: 32px; text-align: center;">
                            <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 12px;">
                                © 2025 CarFindr. Todos los derechos reservados.
                            </p>
                            <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                                <a href="https://carfindr.cachaza.cc" style="color: #3b82f6; text-decoration: none;">carfindr.cachaza.cc</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`, userName, newCarsCount, searchName)

	params := &resend.SendEmailRequest{
		From:    "CarFindr <" + n.fromAddress + ">",
		To:      []string{recipient.Email},
		Html:    htmlBody,
		Subject: subject,
		Text:    plainTextBody,
	}

	sent, err := n.resendClient.Emails.Send(params)
	if err != nil {
		return fmt.Errorf("error al enviar email a %s via Resend: %w", recipient.Email, err)
	}
	log.Printf("Email enviado a %s via Resend, ID: %s", recipient.Email, sent.Id)
	return nil
}
