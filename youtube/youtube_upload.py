import os, sys, json
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

BASE = os.path.dirname(os.path.abspath(__file__))
SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]
TOKENS = os.path.join(BASE, "tokens.json")
VIDEO = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(BASE), "promo", "out", "polymint_promo.mp4")

TITLE = "Create Your Own Crypto Token in Minutes - No Code | PolyMint"
DESCRIPTION = """Create your own crypto token on Polygon - no code, in minutes, 100% yours.

PolyMint lets anyone launch a halal-friendly ERC-20 token on the Polygon network without writing a single line of code. Get daily crypto lessons, market analysis and educational signals.

Website: https://ploymint.polyganfactorytoken.workers.dev
Telegram: https://t.me/polymint_crypto

#crypto #bitcoin #cryptocurrency #blockchain #polygon #ethereum #defi #cryptonews #altcoin #halal
#عملات_الرقمية #بيتكوين #كريبتو #بلوكشين
#رمزارز #کریپتو #بلاک‌چین
#criptomonedas #criptomoedas #kriptopara #kripto #криптовалюта #加密货币
#cryptomonnaie #kryptowaehrungen #cryptovaluta #krypto #cripto"""
TAGS = [
    "crypto", "cryptocurrency", "bitcoin", "blockchain", "polygon", "ethereum", "defi",
    "cryptonews", "altcoin", "token", "erc20", "halal", "make money online", "passive income",
    "cryptocurrency for beginners", "token creation", "smart contract",
    "عملات الرقمية", "بيتكوين", "بلاوكشين", "رمزارز", "بیت کوین", "کریپتو",
    "criptomonedas", "criptomoedas", "kriptopara", "криптовалюта", "加密货币",
]
CATEGORY_ID = "28"
PRIVACY = "public"

def main():
    if not os.path.exists(TOKENS):
        print("tokens.json not found. Run youtube_setup.py first.")
        raise SystemExit(1)
    if not os.path.exists(VIDEO):
        print("video not found:", VIDEO)
        raise SystemExit(1)
    creds = Credentials.from_authorized_user_file(TOKENS, SCOPES)
    youtube = build("youtube", "v3", credentials=creds)
    body = {
        "snippet": {
            "title": TITLE,
            "description": DESCRIPTION,
            "tags": TAGS,
            "categoryId": CATEGORY_ID,
        },
        "status": {"privacyStatus": PRIVACY, "selfDeclaredMadeForKids": False},
    }
    media = MediaFileUpload(VIDEO, chunksize=4 * 1024 * 1024, resumable=True, mimetype="video/mp4")
    req = youtube.videos().insert(part="snippet,status", body=body, media_body=media)
    response = None
    while response is None:
        status, response = req.next_chunk()
        if status:
            print(f"Uploaded {int(status.progress() * 100)}%")
    vid = response.get("id")
    print("UPLOADED https://youtu.be/" + vid)

if __name__ == "__main__":
    main()
