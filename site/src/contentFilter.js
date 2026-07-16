// src/contentFilter.js
// فیلتر محتوای نام و نماد توکن — قبل از ارسال تراکنش اجرا می‌شود.
// این فیلتر روی چهار دسته عمومی کار می‌کند (نه هویت افراد):
//   ۱. کلمات رکیک و فحش
//   ۲. محتوای جنسی صریح
//   ۳. گفتار نفرت‌پراکنانه/توهین‌آمیز به گروه‌های نژادی، قومی یا مذهبی
//   ۴. جعل نام توکن‌های معروف (ریسک امنیتی واقعی برای خریداران)

// لیست‌ها را می‌توانید بسته به نیاز خودتان گسترش دهید.
const PROFANITY = [
  // انگلیسی و فارسی — نمونه، لیست کامل را خودتان تکمیل کنید
  "fuck", "shit", "bitch", "asshole",
  "کیر", "کص", "جنده", "کونی",
];

const EXPLICIT_SEXUAL = [
  "porn", "xxx", "sex", "nsfw",
  "پورن", "سکس",
];

const HATE_SPEECH = [
  // اصطلاحات نژادپرستانه/توهین‌آمیز شناخته‌شده — نمونه
  "nazi", "hitler", "isis", "daesh",
  "نازی", "داعش",
];

// توهین و تمسخر مقدسات ادیان (به‌طور یکسان برای همه ادیان: اسلام، مسیحیت، یهودیت و غیره)
// نکته مهم: این دسته فقط محتوای صریحاً توهین‌آمیز/تمسخرآمیز را مسدود می‌کند،
// نه کلمات توصیفی هویت افراد (مثل «آته‌ئیست» یا «بی‌دین») که توهین محسوب نمی‌شوند.
const RELIGIOUS_BLASPHEMY = [
  // نمونه — این لیست را خودتان با دقت گسترش دهید؛ فقط عبارات صریحاً توهین‌آمیز اضافه شود
  "blasphemy",
];

// نام‌های توکن‌های معروف که تقلیدشان ریسک کلاهبرداری برای خریداران دارد
const IMPERSONATION = [
  "usdt", "tether", "usdc", "bitcoin", "btc", "ethereum", "eth",
  "binance", "bnb", "matic", "polygon",
];

const ALL_BLOCKED = [...PROFANITY, ...EXPLICIT_SEXUAL, ...HATE_SPEECH, ...RELIGIOUS_BLASPHEMY, ...IMPERSONATION];

/**
 * نرمال‌سازی متن برای دور زدن ترفندهای رایج فیلترشکنی
 * (مثل k1r به‌جای kir، یا فاصله‌گذاری بین حروف)
 */
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[\s\-_.]/g, "") // حذف فاصله، خط تیره، زیرخط، نقطه
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t");
}

/**
 * بررسی می‌کند آیا نام یا نماد توکن شامل محتوای مسدودشده است.
 * @param {string} name
 * @param {string} symbol
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function checkTokenContent(name, symbol) {
  const combined = normalize(`${name} ${symbol}`);

  for (const word of ALL_BLOCKED) {
    const normalizedWord = normalize(word);
    if (combined.includes(normalizedWord)) {
      return {
        allowed: false,
        reason: "این نام یا نماد شامل محتوای غیرمجاز است (فحش، محتوای جنسی صریح، گفتار نفرت‌پراکنانه، یا جعل نام توکن شناخته‌شده). لطفاً نام دیگری انتخاب کنید.",
      };
    }
  }

  return { allowed: true };
}
