import os, json
from google_auth_oauthlib.flow import InstalledAppFlow

BASE = os.path.dirname(os.path.abspath(__file__))
SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]
CLIENT_SECRET = os.path.join(BASE, "client_secret.json")
TOKENS = os.path.join(BASE, "tokens.json")

if not os.path.exists(CLIENT_SECRET):
    print("client_secret.json not found. Save the OAuth Desktop client JSON here:", BASE)
    raise SystemExit(1)

flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRET, SCOPES)
creds = flow.run_local_server(port=8080, prompt="consent")
with open(TOKENS, "w") as f:
    f.write(creds.to_json())

with open(CLIENT_SECRET) as f:
    cs = json.load(f)["installed"]

print("\n===== AUTHORIZED OK =====\n")
print("Save these 3 values as GitHub Actions secrets in the repo:")
print("  Settings -> Secrets and variables -> Actions -> New repository secret\n")
print("1) Secret name : YT_CLIENT_ID")
print("   Value       :", cs["client_id"])
print()
print("2) Secret name : YT_CLIENT_SECRET")
print("   Value       :", cs["client_secret"])
print()
print("3) Secret name : YT_REFRESH_TOKEN")
print("   Value       :", creds.refresh_token)
print()
print("tokens.json also saved in", BASE)
