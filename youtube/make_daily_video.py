import asyncio, base64, io, json, os, platform, re, shutil, subprocess, sys, time
from datetime import datetime, timezone

import numpy as np
import requests
import edge_tts
import imageio_ffmpeg
from PIL import Image

BASE = os.path.dirname(os.path.abspath(__file__))
FRAMES = os.path.join(BASE, "daily_frames")
OUT = os.path.join(BASE, "daily_out")
AUDIO = os.path.join(BASE, "daily_audio")
os.makedirs(FRAMES, exist_ok=True)
os.makedirs(OUT, exist_ok=True)
os.makedirs(AUDIO, exist_ok=True)

CF_TOKEN = os.environ.get("CF_API_TOKEN")
CF_ACCT = os.environ.get("CF_ACCOUNT_ID")
TG_TOKEN = os.environ.get("TG_BOT_TOKEN")
TG_CHANNEL = os.environ.get("TG_CHANNEL", "-1003912340521")

FFMPEG = shutil.which("ffmpeg") or imageio_ffmpeg.get_ffmpeg_exe()
if platform.system() == "Windows":
    FONT_BOLD = "C\\:/Windows/Fonts/arialbd.ttf"
    FONT_REG = "C\\:/Windows/Fonts/arial.ttf"
else:
    FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

DUR = 4
FPS = 30
D = DUR * FPS

SITE_URL = "ploymint.polyganfactorytoken.workers.dev"
TG_URL = "t.me/polymint_crypto"

TITLES_A = [
    "Crypto Daily 🚀 {t}",
    "Market Pulse: {t}",
    "Top Crypto Move Today — {t}",
    "Crypto News Daily 📈 {t}",
    "Don't Miss Today's Crypto Update — {t}",
]
TITLES_B = [
    "Learn Crypto: {t}",
    "Crypto Made Simple — {t}",
    "3-Minute Crypto Lesson: {t}",
    "This Crypto Lesson Changes Everything — {t}",
    "Crypto Explained in Minutes: {t}",
]

HASHTAGS = (
    "#crypto #bitcoin #cryptocurrency #blockchain #polygon #ethereum #defi #cryptonews #altcoin #halal "
    "#عملات_الرقمية #بيتكوين #كريبتو #بلوكشين #رمزارز #کریپتو #بیت_کوین "
    "#criptomonedas #criptomoedas #kriptopara #криптовалюта #加密货币"
)

C_WHITE = "white"
C_PURPLE = "#c4b5fd"
C_BLUE = "#7dd3fc"
C_AMBER = "#fcd34d"
C_UP = "#4ade80"
C_DOWN = "#f87171"


def esc(s):
    return s.replace("\\", " ").replace("'", "’").replace('"', "”").replace(":", "\\:")


def clean(s, n):
    s = re.sub(r"\s+", " ", (s or "")).strip()
    if len(s) > n:
        s = s[: n - 1].rstrip() + "…"
    return s


def fmt_price(n):
    try:
        n = float(n)
    except Exception:
        return "n/a"
    if n >= 1:
        return f"${n:,.2f}"
    return f"${n:.4f}"


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(r.stderr[-2000:])


def fetch_market():
    try:
        r = requests.get("https://min-api.cryptocompare.com/data/pricemultifull?fsyms=BTC,ETH,SOL,BNB,POL&tsyms=USD",
                         headers={"User-Agent": "Mozilla/5.0 PolyMintBot"}, timeout=20)
        d = r.json()
        rows = []
        for sym in ["BTC", "ETH", "BNB", "SOL", "POL"]:
            u = d["RAW"][sym]["USD"]
            rows.append((sym, u["PRICE"], u["CHANGEPCT24HOUR"] or 0))
        return rows
    except Exception:
        return [("BTC", 0, 0), ("ETH", 0, 0), ("BNB", 0, 0), ("SOL", 0, 0), ("POL", 0, 0)]


def fetch_article():
    try:
        r = requests.get("https://ploymint.polyganfactorytoken.workers.dev/api/articles", timeout=20)
        t = r.json()["today"]
        return {"title": t["titleEn"], "body": t["bodyEn"]}
    except Exception:
        return {"title": "Crypto Daily Lesson",
                "body": "Learn something new about halal crypto every day with PolyMint."}


def gen_bg(prompt, path):
    r = requests.post(
        f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCT}/ai/run/@cf/black-forest-labs/flux-1-schnell",
        headers={"Authorization": f"Bearer {CF_TOKEN}"},
        json={"prompt": prompt, "steps": 4}, timeout=90)
    r.raise_for_status()
    d = r.json()
    img = Image.open(io.BytesIO(base64.b64decode(d["result"]["image"]))).convert("RGB")
    img.save(path)


def make_music():
    sr = 44100
    dur = 30.0
    t = np.linspace(0, dur, int(sr * dur), endpoint=False)
    out = np.zeros_like(t)
    chords = [[130.81, 261.63, 329.63, 392.0, 493.88], [110.0, 220.0, 261.63, 329.63, 392.0],
              [87.31, 174.61, 220.0, 261.63, 349.23], [98.0, 196.0, 246.94, 293.66, 392.0]]
    seg_len = dur / len(chords)
    for i, chord in enumerate(chords):
        t0, t1 = i * seg_len, (i + 1) * seg_len
        mask = (t >= t0) & (t < t1)
        tt = t[mask] - t0
        env = np.maximum(np.minimum(1, tt / 1.2) * np.minimum(1, (t1 - t0 - tt) / 1.2), 0)
        for f in chord:
            out[mask] += 0.12 * np.sin(2 * np.pi * f * tt) * env
            out[mask] += 0.02 * np.sin(2 * np.pi * f * 2.0 * tt) * env
    out *= 0.32 / max(np.max(np.abs(out)), 1e-9)
    data = (np.column_stack([out, out]) * 32767).astype(np.int16)
    wf = __import__("wave").open(os.path.join(AUDIO, "music.wav"), "wb")
    wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(sr)
    wf.writeframes(data.tobytes()); wf.close()


async def make_nar(text, path):
    tts = edge_tts.Communicate(text, voice="en-US-AndrewNeural", rate="+8%", pitch="+5Hz")
    await tts.save(path)


def mix_audio(base, nar_path, out):
    music = os.path.join(AUDIO, "music.wav")
    mix = (
        f"[1:a]adelay=350|350,apad,highpass=f=70,acompressor=threshold=-18dB:ratio=2.5:attack=10:release=120:makeup=3,"
        f"volume=1.6,aformat=sample_rates=44100:channel_layouts=stereo[nar];"
        f"[2:a]atrim=0:{DUR},volume=0.10,afade=t=in:st=0:d=0.5,aformat=sample_rates=44100:channel_layouts=stereo[mus];"
        f"[nar][mus]amix=inputs=2:duration=longest:dropout_transition=0,"
        f"loudnorm=I=-14:TP=-1.5:LRA=11[a]"
    )
    run([FFMPEG, "-y", "-i", base, "-i", nar_path, "-i", music, "-filter_complex", mix,
         "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k",
         "-ar", "48000", "-t", str(DUR), out])


def render_segment(idx, bg, lines, nar_path, out_seg):
    graph = (
        f"[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,"
        f"gblur=sigma=22,eq=brightness=-0.28:saturation=1.12[bg];"
        f"[bg]zoompan=z='min(1+0.0009*on,1.25)':d={D}:fps={FPS}:s=1080x1920[zp]"
    )
    cur = "[zp]"
    for k, (txt, size, bold, color, y) in enumerate(lines):
        ff = FONT_BOLD if bold else FONT_REG
        nxt = f"[t{k}]"
        graph += (f";{cur}drawtext=fontfile='{ff}':text='{esc(txt)}':fontcolor={color}:"
                  f"fontsize={size}:x=(w-text_w)/2:y={y}:shadowcolor=black@0.7:shadowx=3:shadowy=3{nxt}")
        cur = nxt
    graph += f";{cur}fade=t=in:st=0:d=0.4,fade=t=out:st={DUR - 0.4}:d=0.4[v]"
    base = out_seg.replace(".mp4", "_base.mp4")
    run([FFMPEG, "-y", "-i", bg, "-filter_complex", graph, "-map", "[v]",
         "-c:v", "libx264", "-preset", "medium", "-crf", "23", "-pix_fmt", "yuv420p",
         "-r", str(FPS), "-t", str(DUR), "-an", base])
    mix_audio(base, nar_path, out_seg)
    print("  seg", idx, "ok")


def concat(segs, final):
    lst = os.path.join(OUT, "list.txt")
    with open(lst, "w") as fh:
        for s in segs:
            fh.write(f"file '{os.path.basename(s)}'\n")
    run([FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", lst,
         "-c", "copy", "-movflags", "+faststart", final])
    print("final:", final, os.path.getsize(final) // 1024, "KB")


def endcard_lines():
    return [
        ("PolyMint", 140, True, C_WHITE, 500),
        ("Daily halal crypto lessons", 62, False, C_WHITE, 690),
        (SITE_URL, 42, True, C_PURPLE, 980),
        (TG_URL, 46, True, C_BLUE, 1090),
        ("Subscribe for daily crypto", 56, True, C_WHITE, 1260),
    ]


def build_video(tag, scenes, final, title, description):
    nars = []
    for i, sc in enumerate(scenes, 1):
        bg = os.path.join(FRAMES, f"{tag}_bg{i}.png")
        gen_bg(sc["prompt"], bg)
        nar = os.path.join(AUDIO, f"{tag}_nar{i}.mp3")
        asyncio.run(make_nar(sc["nar"], nar))
        nars.append(nar)
        render_segment(i, bg, sc["lines"], nar, os.path.join(OUT, f"{tag}_s{i}.mp4"))
    segs = [os.path.join(OUT, f"{tag}_s{i}.mp4") for i in range(1, len(scenes) + 1)]
    concat(segs, final)
    with open(final.replace(".mp4", ".txt"), "w", encoding="utf-8") as fh:
        fh.write(f"TITLE:\n{title}\n\nDESCRIPTION:\n{description}\n")
    return final


def upload_yt(video, txt_path):
    client_id = os.environ.get("YT_CLIENT_ID")
    client_secret = os.environ.get("YT_CLIENT_SECRET")
    refresh_token = os.environ.get("YT_REFRESH_TOKEN")
    if not all([client_id, client_secret, refresh_token]):
        print("YT: no OAuth secrets (YT_CLIENT_ID/YT_CLIENT_SECRET/YT_REFRESH_TOKEN) -> skipping")
        return False
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
    with open(txt_path, encoding="utf-8") as fh:
        body_txt = fh.read()
    title = body_txt.split("TITLE:")[1].split("DESCRIPTION:")[0].strip()
    description = body_txt.split("DESCRIPTION:")[1].strip()
    creds = Credentials(
        token=None, refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=client_id, client_secret=client_secret,
        scopes=["https://www.googleapis.com/auth/youtube.upload"])
    youtube = build("youtube", "v3", credentials=creds)
    tags = [w.lstrip("#") for w in HASHTAGS.split() if w.startswith("#")][:25]
    body = {
        "snippet": {"title": title[:100], "description": description[:4800], "tags": tags,
                    "categoryId": "28"},
        "status": {"privacyStatus": "public", "selfDeclaredMadeForKids": False},
    }
    media = MediaFileUpload(video, chunksize=4 * 1024 * 1024, resumable=True, mimetype="video/mp4")
    req = youtube.videos().insert(part="snippet,status", body=body, media_body=media)
    while True:
        status, resp = req.next_chunk()
        if resp:
            print("YT UPLOADED https://youtu.be/" + resp["id"])
            return True
        if status:
            print("  YT progress", int(status.progress() * 100), "%")


def upload_tg(video, caption):
    data = {"chat_id": TG_CHANNEL, "caption": caption, "parse_mode": "HTML",
            "reply_markup": json.dumps({"inline_keyboard": [[
                {"text": "🚀 Create Token", "url": "https://ploymint.polyganfactorytoken.workers.dev/"},
                {"text": "✈️ Join Channel", "url": "https://t.me/polymint_crypto"}]]})}
    for attempt in range(3):
        try:
            with open(video, "rb") as f:
                r = requests.post(f"https://api.telegram.org/bot{TG_TOKEN}/sendVideo",
                                  data=data, files={"video": (os.path.basename(video), f, "video/mp4")},
                                  timeout=180)
            j = r.json()
            print(os.path.basename(video), "->", j.get("ok"), j.get("description", ""))
            if j.get("ok"):
                return True
            print("  retrying after non-ok:", j.get("description"))
        except Exception as e:
            print(f"  upload attempt {attempt + 1} failed: {e}")
        time.sleep(15 * (attempt + 1))
    return False


def main():
    if not CF_TOKEN or not CF_ACCT:
        sys.exit("CF_API_TOKEN / CF_ACCOUNT_ID env vars required")
    if not TG_TOKEN:
        sys.exit("TG_BOT_TOKEN env var required")
    art = fetch_article()
    market = fetch_market()
    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    vibes = ["purple and gold", "blue and cyan", "teal and emerald", "rose and violet",
             "amber and gold", "indigo and silver", "green and gold"]
    vibe = vibes[datetime.now(timezone.utc).weekday()]
    news_prompt = (f"Abstract futuristic crypto news background, {vibe} neon glow, "
                   f"dark navy, glowing coins and chart lines, cinematic, no text, no people")
    learn_prompt = (f"Abstract elegant blockchain learning background, {vibe} glow, "
                    f"soft floating crystal blocks, dark background, cinematic, no text, no people")

    title = clean(art["title"], 60)
    teaser = clean(art["body"], 180)
    bullets = []
    for sent in re.split(r"(?<=[.!?])\s+", art["body"]):
        c = clean(sent, 46)
        if len(c) >= 20 and len(bullets) < 3:
            bullets.append("• " + c)
    while len(bullets) < 3:
        bullets.append("• Keep learning one step at a time")

    m = market[:4]
    price_lines = []
    for sym, price, ch in m:
        color = C_UP if ch >= 0 else C_DOWN
        sign = "+" if ch >= 0 else ""
        price_lines.append((f"{sym}  {fmt_price(price)}  {sign}{ch:.2f}%", 56, True, color,
                            560 + len(price_lines) * 120))

    make_music()

    scenes_a = [
        {"prompt": news_prompt, "nar": "PolyMint crypto daily. Halal friendly crypto news and market update.",
         "lines": [("PolyMint Crypto Daily", 92, True, C_WHITE, 380),
                   (date_str, 58, False, C_BLUE, 560),
                   ("Halal-friendly crypto news", 56, False, C_WHITE, 690)]},
        {"prompt": news_prompt, "nar": "Here is today's price action across the major cryptocurrencies.",
         "lines": [("Market Update", 88, True, C_WHITE, 400)] + price_lines},
        {"prompt": learn_prompt, "nar": f"Today's lesson. {title}.",
         "lines": [("Today's Lesson", 70, True, C_AMBER, 380), (title, 56, True, C_WHITE, 540)]},
        {"prompt": news_prompt, "nar": clean(teaser, 130),
         "lines": [("Key Insight", 66, True, C_PURPLE, 380),
                   (clean(teaser, 100), 52, False, C_WHITE, 580),
                   (clean(teaser[len(teaser) // 2:], 80), 48, False, C_WHITE, 760)]},
        {"prompt": news_prompt, "nar": "Follow us on Telegram, and start creating your own token today. Links below.",
         "lines": endcard_lines()},
    ]
    scenes_b = [
        {"prompt": learn_prompt, "nar": "Today's crypto lesson. Learn halal crypto every day with PolyMint.",
         "lines": [("Today's Crypto Lesson", 84, True, C_WHITE, 400), (date_str, 56, False, C_BLUE, 580),
                   ("Learn halal crypto daily", 52, False, C_WHITE, 700)]},
        {"prompt": learn_prompt, "nar": f"Today's lesson. {title}.",
         "lines": [("Topic", 66, True, C_AMBER, 380), (title, 58, True, C_WHITE, 560)]},
        {"prompt": learn_prompt, "nar": "Here are three key ideas from today's lesson.",
         "lines": [("3 Key Ideas", 72, True, C_PURPLE, 360)] +
                  [(b, 48, False, C_WHITE, 560 + i * 130) for i, b in enumerate(bullets)]},
        {"prompt": news_prompt, "nar": clean(teaser, 130),
         "lines": [("Key Insight", 66, True, C_PURPLE, 380),
                   (clean(teaser, 100), 52, False, C_WHITE, 580),
                   (clean(teaser[len(teaser) // 2:], 80), 48, False, C_WHITE, 760)]},
        {"prompt": news_prompt, "nar": "Follow us on Telegram, and start creating your own token today. Links below.",
         "lines": endcard_lines()},
    ]

    rot = datetime.now(timezone.utc).toordinal()
    title_a = TITLES_A[rot % len(TITLES_A)].format(t=title)
    title_b = TITLES_B[(rot + 2) % len(TITLES_B)].format(t=title)

    desc = (f"Today's halal-friendly crypto lesson: {title}.\n\n"
            f"Website: https://{SITE_URL}\nTelegram: https://{TG_URL}\n\n"
            f"{HASHTAGS}")
    cap = (f"📊 <b>PolyMint Crypto Daily</b>\n{title}\n\n"
           f"🌐 https://{SITE_URL}\n✈️ https://{TG_URL}\n\n{HASHTAGS}")
    def upload_all():
        market_mp4 = os.path.join(OUT, "daily_market.mp4")
        lesson_mp4 = os.path.join(OUT, "daily_lesson.mp4")
        upload_tg(market_mp4, cap)
        upload_tg(lesson_mp4, cap)
        upload_yt(market_mp4, market_mp4.replace(".mp4", ".txt"))
        upload_yt(lesson_mp4, lesson_mp4.replace(".mp4", ".txt"))

    if "--upload-only" in sys.argv:
        upload_all()
        return
    build_video("a", scenes_a, os.path.join(OUT, "daily_market.mp4"),
                title_a,
                desc)
    build_video("b", scenes_b, os.path.join(OUT, "daily_lesson.mp4"),
                title_b,
                desc)
    upload_all()


if __name__ == "__main__":
    main()
