import { loadGoogleClient } from "./google-client.mjs";

const { clientId, redirectUri } = loadGoogleClient();
if (!clientId) throw new Error("Set GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET_FILE before running this script.");
const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
url.searchParams.set("client_id", clientId);
url.searchParams.set("redirect_uri", redirectUri);
url.searchParams.set("response_type", "code");
url.searchParams.set("scope", "https://www.googleapis.com/auth/gmail.readonly");
url.searchParams.set("access_type", "offline");
url.searchParams.set("prompt", "consent");
console.log(url.toString());
