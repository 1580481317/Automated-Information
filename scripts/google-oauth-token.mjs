import { loadGoogleClient } from "./google-client.mjs";

const code = process.env.GOOGLE_AUTH_CODE;
const { clientId, clientSecret, redirectUri } = loadGoogleClient();

for (const [name, value] of Object.entries({ GOOGLE_AUTH_CODE: code, GOOGLE_CLIENT_ID: clientId, GOOGLE_CLIENT_SECRET: clientSecret })) {
  if (!value) throw new Error(`Set ${name} before running this script.`);
}

const params = new URLSearchParams({
  code,
  client_id: clientId,
  client_secret: clientSecret,
  redirect_uri: redirectUri,
  grant_type: "authorization_code",
});

const res = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: params,
});
const data = await res.json();
if (!res.ok) throw new Error(JSON.stringify(data));
console.log(JSON.stringify({
  refresh_token: data.refresh_token,
  scope: data.scope,
  token_type: data.token_type,
  expires_in: data.expires_in,
}, null, 2));
