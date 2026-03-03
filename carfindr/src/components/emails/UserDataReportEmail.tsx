import * as React from 'react';

// Define interfaces for the data structures based on your schema
// You might need to adjust these based on the exact structure of your schema.ts
interface UserData {
  id: string;
  name?: string | null;
  email?: string | null;
  emailVerified?: boolean;
  image?: string | null;
}

interface AccountData {
  providerId: string;
  accountId: string;
}

interface SavedSearchData {
  id: number; // Changed from string to number
  name: string | null;
  brandId?: string | null;
  modelId?: string | null;
  yearFrom?: number | null;
  yearTo?: number | null;
  priceFrom?: number | null;
  priceTo?: number | null;
  kmFrom?: number | null;
  kmTo?: number | null;
  transmission?: string | null;
  searchText?: string | null;
  brandParam?: string | null;
  modelParam?: string | null;
  createdAt: Date;
}

interface UserDataReportEmailProps {
  userName: string | null | undefined;
  userData: UserData;
  accounts: AccountData[];
  savedSearches: SavedSearchData[];
}

const mainColor = 'hsl(221.2, 83.2%, 53.3%)';
const mainColorLight = 'hsl(221.2, 83.2%, 95%)';

export const UserDataReportEmail = ({
  userName,
  userData,
  accounts,
  savedSearches,
}: Readonly<UserDataReportEmailProps>) => (
  <html>
    <head>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Tu Informe de Datos de CarFindr</title>
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
            padding: 20px;
            line-height: 1.6;
            text-align: left;
          }
          .content h2 {
            color: ${mainColor};
            border-bottom: 2px solid ${mainColorLight};
            padding-bottom: 5px;
            margin-top: 20px;
          }
          .content p {
            margin-bottom: 10px;
          }
          .data-section {
            margin-bottom: 20px;
            padding: 15px;
            background-color: ${mainColorLight};
            border-radius: 5px;
          }
          .data-section ul {
            list-style-type: none;
            padding-left: 0;
          }
          .data-section li {
            margin-bottom: 8px;
            word-break: break-word;
          }
          .data-section strong {
            color: ${mainColor};
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
          <h1>Tu Informe de Datos de CarFindr</h1>
        </div>
        <div className="content">
          <p>Hola {userName ?? 'usuario'},</p>
          <p>Has solicitado una copia de los datos que CarFindr tiene sobre ti. A continuación, encontrarás la información que hemos recopilado:</p>

          <div className="data-section">
            <h2>Información de Usuario</h2>
            <ul>
              <li><strong>ID de Usuario:</strong> {userData.id}</li>
              <li><strong>Nombre:</strong> {userData.name ?? 'No proporcionado'}</li>
              <li><strong>Email:</strong> {userData.email ?? 'No proporcionado'}</li>
              <li><strong>Email Verificado:</strong> {userData.emailVerified ? 'Si' : 'No'}</li>
              <li><strong>Imagen de Perfil URL:</strong> {userData.image ?? 'No proporcionada'}</li>
            </ul>
          </div>

          {accounts.length > 0 && (
            <div className="data-section">
              <h2>Cuentas Vinculadas</h2>
              <ul>
                {accounts.map((account, index) => (
                  <li key={index}>
                    <strong>Proveedor:</strong> {account.providerId} (<strong>ID de Cuenta del Proveedor:</strong> {account.accountId})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {savedSearches.length > 0 && (
            <div className="data-section">
              <h2>Búsquedas Guardadas</h2>
              {savedSearches.map((search, index) => (
                <div key={search.id} style={{ marginBottom: '15px', paddingBottom: '10px', borderBottom: index < savedSearches.length -1 ? '1px solid #ddd' : 'none' }}>
                  <p><strong>Nombre de Búsqueda:</strong> {search.name ?? 'Sin nombre'} (ID: {search.id})</p>
                  <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
                    {search.brandParam && <li><strong>Marca:</strong> {search.brandParam}</li>}
                    {search.modelParam && <li><strong>Modelo:</strong> {search.modelParam}</li>}
                    {search.yearFrom && <li><strong>Año Desde:</strong> {search.yearFrom}</li>}
                    {search.yearTo && <li><strong>Año Hasta:</strong> {search.yearTo}</li>}
                    {search.priceFrom && <li><strong>Precio Desde:</strong> {search.priceFrom}€</li>}
                    {search.priceTo && <li><strong>Precio Hasta:</strong> {search.priceTo}€</li>}
                    {search.kmFrom && <li><strong>Km Desde:</strong> {search.kmFrom}</li>}
                    {search.kmTo && <li><strong>Km Hasta:</strong> {search.kmTo}</li>}
                    {search.transmission && <li><strong>Transmisión:</strong> {search.transmission}</li>}
                    {search.searchText && <li><strong>Texto de Búsqueda:</strong> {search.searchText}</li>}
                  </ul>
                  <p><strong>Fecha de Creación:</strong> {new Date(search.createdAt).toLocaleString('es-ES')}</p>
                </div>
              ))}
            </div>
          )}

          {accounts.length === 0 && savedSearches.length === 0 && (
             <p>No hemos encontrado datos adicionales (como cuentas vinculadas o búsquedas guardadas) asociados a tu perfil.</p>
          )}

          <p>Si tienes alguna pregunta sobre tus datos o deseas ejercer otros derechos de privacidad, por favor, contáctanos respondiendo a este correo.</p>
          <p>Gracias por usar CarFindr.</p>
          <p>Atentamente,<br />El equipo de CarFindr</p>
        </div>
        <div className="footer">
          <p>&copy; {new Date().getFullYear()} CarFindr. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
  </html>
);

export default UserDataReportEmail;
