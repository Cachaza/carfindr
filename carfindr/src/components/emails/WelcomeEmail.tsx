import * as React from 'react';
import { env } from '@/env';

interface WelcomeEmailProps {
  userName: string;
}

const mainColor = 'hsl(221.2, 83.2%, 53.3%)';
const mainColorLight = 'hsl(221.2, 83.2%, 95%)'; // A lighter shade for background

export const WelcomeEmail = ({ userName }: Readonly<WelcomeEmailProps>) => (
  <html>
    <head>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>¡Bienvenido a MotorFindr!</title>
      <style>
        {`
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
          .header {
            background-color: ${mainColor};
            color: white;
            padding: 20px;
            text-align: center;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 30px 20px;
            line-height: 1.6;
            text-align: left;
          }
          .content p {
            margin-bottom: 15px;
          }
          .button-container {
            text-align: center;
            margin-top: 20px;
          }
          .button {
            background-color: ${mainColor};
            color: white !important;
            padding: 12px 25px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            display: inline-block;
          }
          .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #777;
            background-color: ${mainColorLight};
            border-bottom-left-radius: 8px;
            border-bottom-right-radius: 8px;
            margin-top: 20px;
          }
        `}
      </style>
    </head>
    <body>
      <div className="container">
        <div className="header">
          <h1>¡Bienvenido a MotorFindr!</h1>
        </div>
        <div className="content">
          <p>Hola {userName},</p>
          <p>¡Gracias por registrarte en MotorFindr! Estamos emocionados de tenerte con nosotros.</p>
          <p>MotorFindr te ayuda a encontrar las mejores ofertas de coches de segunda mano en diferentes plataformas, todo en un solo lugar. Esperamos que disfrutes de la experiencia y encuentres el coche de tus sueños.</p>
          <div className="button-container">
            <a href={env.NEXT_PUBLIC_APP_URL} className="button">Explorar coches ahora</a>
          </div>
          <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          <p>¡Saludos,<br />El equipo de MotorFindr</p>
        </div>
        <div className="footer">
          <p>&copy; {new Date().getFullYear()} MotorFindr. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
  </html>
);

export default WelcomeEmail;
