import fs from "node:fs";

export function loadGoogleClient() {
  const file = process.env.GOOGLE_CLIENT_SECRET_FILE;
  if (file) {
    const raw = JSON.parse(fs.readFileSync(file, "utf8"));
    const client = raw.installed ?? raw.web;
    if (!client) throw new Error("Google client JSON must contain installed or web.");
    return {
      clientId: client.client_id,
      clientSecret: client.client_secret,
      redirectUri: process.env.GOOGLE_REDIRECT_URI || client.redirect_uris?.[0] || "http://localhost",
    };
  }
  return {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/oauth2callback",
  };
}
