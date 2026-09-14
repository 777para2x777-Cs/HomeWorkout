/* ===================== FitCore Home — app logic ===================== */
'use strict';
const APP_VERSION = '2026-09-14.2'; // bumped on every deploy — check against Settings to confirm the device isn't on stale cached code

/* ---------- small utils ---------- */
const FA_DIGITS = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
function toFa(input) {
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[+d]);
}
function pad2(n) { return n < 10 ? '0' + n : '' + n; }
function todayISO(d = new Date()) {
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}
function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}
function readJSON(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function writeJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

/* ---------- Jalali (Shamsi) date conversion ---------- */
const PERSIAN_MONTHS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
const PERSIAN_WEEKDAYS = ['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه']; // index = JS getDay()
const PERSIAN_WEEK_JSDAYS = [6, 0, 1, 2, 3, 4, 5]; // شنبه..جمعه

function gregorianToJalali(gy, gm, gd) {
  const g_d_m = [0,31,59,90,120,151,181,212,243,273,304,334];
  let jy;
  if (gy <= 1600) { jy = 0; gy -= 621; } else { jy = 979; gy -= 1600; }
  const gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) { jy += Math.floor((days - 1) / 365); days = (days - 1) % 365; }
  let jm, jd;
  if (days < 186) { jm = 1 + Math.floor(days / 31); jd = 1 + (days % 31); }
  else { jm = 7 + Math.floor((days - 186) / 30); jd = 1 + ((days - 186) % 30); }
  return [jy, jm, jd];
}
function formatShamsi(date) {
  const [jy, jm, jd] = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return `${toFa(jd)} ${PERSIAN_MONTHS[jm - 1]} ${toFa(jy)}`;
}
function weekdayName(date) { return PERSIAN_WEEKDAYS[date.getDay()]; }

/* ---------- icons ---------- */
const ICONS = {
  today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M2 12h2.2M19.8 12H22M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5" stroke-linecap="round"/></svg>',
  week: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="4.5" width="17" height="16" rx="3"/><path d="M3.5 9.5h17M8 3v3M16 3v3" stroke-linecap="round"/></svg>',
  library: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2.5" y="10" width="3" height="4"/><rect x="18.5" y="10" width="3" height="4"/><rect x="6" y="8" width="3" height="8"/><rect x="15" y="8" width="3" height="8"/><path d="M9 12h6"/></svg>',
  progress: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V10M11 19V5M18 19v-7"/><path d="M3 19h18"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.5-2-3.4-2.4.6a7.7 7.7 0 0 0-1.7-1L14.8 3h-4l-.5 2.7a7.7 7.7 0 0 0-1.7 1l-2.4-.6-2 3.4L6 11a7.6 7.6 0 0 0 0 2l-2 1.5 2 3.4 2.4-.6c.5.4 1.1.75 1.7 1L10.8 21h4l.5-2.7c.6-.25 1.2-.6 1.7-1l2.4.6 2-3.4-2-1.5Z"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.3M12 19.2v2.3M4.4 4.4l1.6 1.6M18 18l1.6 1.6M2.5 12h2.3M19.2 12h2.3M4.4 19.6L6 18M18 6l1.6-1.6"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z"/></svg>',
  dumbbell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 10v4M2.5 9.5v5M7 8v8M17 8v8M20 9.5v5M9.5 12h5"/></svg>',
  band: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 6c6 4 10-4 16 0M4 12c6 4 10-4 16 0M4 18c6 4 10-4 16 0"/></svg>',
  bike: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="6" cy="17" r="3.4"/><circle cx="18" cy="17" r="3.4"/><path d="M6 17l4-8h5l3 8M10 9h3M13 5.5h3l3 3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  mat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M9 6v12"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.2v13.6c0 .8.9 1.3 1.6.9l11-6.8c.6-.4.6-1.3 0-1.7l-11-6.8c-.7-.4-1.6.1-1.6.8Z"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></svg>',
};
const EQUIP_ICON = { 'دمبل': ICONS.dumbbell, 'کش مقاومتی': ICONS.band, 'دوچرخه اسپینینگ': ICONS.bike, 'مت': ICONS.mat, 'بدون وسیله': ICONS.bolt };

const CAT_LABEL = { strength: 'قدرتی', cardio: 'کاردیو', core: 'شکم', recovery: 'ریکاوری', rest: 'استراحت' };

/* ---------- exercise library (used in the 3-day program) ---------- */
const EXERCISES = {
  goblet_squat: { name: 'اسکوات گابلت با دمبل', equipment: ['دمبل'], category: 'strength',
    video: 'https://www.youtube.com/watch?v=JO7D6GJ98wY',
    cues: ['دمبل را عمودی جلوی سینه با دو دست نگه دار', 'باسن را به عقب و پایین ببر، زانو هم‌جهت نوک پا', 'پاشنه‌ها روی زمین، سینه بالا'] },
  floor_press: { name: 'پرس سینه دمبل روی مت', equipment: ['دمبل', 'مت'], category: 'strength',
    video: 'https://www.youtube.com/watch?v=uUGDRwge4F8',
    cues: ['روی مت دراز بکش، زانو خم و کف پا روی زمین', 'دمبل‌ها را از سینه به سمت بالا فشار بده', 'آرنج‌ها را کمی پایین‌تر از خط شانه نگه دار'] },
  bent_row: { name: 'زیربغل خم با دمبل', equipment: ['دمبل'], category: 'strength',
    video: 'https://www.youtube.com/watch?v=6TSP1TRMUzs',
    cues: ['زانو کمی خم، کمر صاف، از لگن خم شو', 'دمبل‌ها را به سمت پهلو بکش، آرنج نزدیک بدن', 'در بالای حرکت یک لحظه فشار کتف‌ها را حس کن'] },
  band_overhead_press: { name: 'پرس سرشانه ایستاده با کش', equipment: ['کش مقاومتی'], category: 'strength',
    video: 'https://www.youtube.com/watch?v=SoKGZpyXUMY',
    cues: ['حلقه‌ی پایینی کش (بند مچ‌پا) رو زیر یک یا دو پا بذار، یا کش رو پایین درب انکر کن', 'دسته‌ی وسط رو کنار شانه بگیر و بالای سر فشار بده تا دست‌ها صاف شوند', 'شکم منقبض تا کمر قوس نکند'] },
  rdl: { name: 'ددلیفت رومانیایی با دمبل', equipment: ['دمبل'], category: 'strength',
    video: 'https://www.youtube.com/watch?v=aa57T45iFSE',
    cues: ['دمبل‌ها جلوی ران، زانو کمی خم و ثابت', 'از لگن خم شو، دمبل‌ها نزدیک پا پایین بروند', 'کمر صاف بماند، پشت ران را حس کن'] },
  walking_lunge: { name: 'لانژ راه‌رونده با دمبل', equipment: ['دمبل'], category: 'strength',
    video: 'https://www.youtube.com/watch?v=I34ysEkPK7w',
    cues: ['دمبل‌ها کنار بدن، یک قدم بلند جلو بردار', 'زانوی عقب نزدیک زمین، زانوی جلو بالای مچ پا', 'با فشار پای جلو بلند شو و قدم بعد را بردار'] },
  band_chest_press: { name: 'پرس سینه ایستاده با کش', equipment: ['کش مقاومتی'], category: 'strength',
    video: 'https://www.youtube.com/watch?v=6-86jEAXA08',
    cues: ['کش رو با بند بالای درب (لولا یا لبه‌ی بالای درب) انکر کن، تقریباً هم‌ارتفاع سینه', 'پشت به درب بایست، دسته رو با دو دست بگیر و رو به جلو فشار بده', 'یک قدم جلوتر برو تا کش کشیده بمونه، برگشت رو آهسته و کنترل‌شده انجام بده'] },
  single_arm_row: { name: 'زیربغل تک‌دست با دمبل', equipment: ['دمبل'], category: 'strength',
    video: 'https://www.youtube.com/watch?v=fURsHPHgssI',
    cues: ['یک دست و زانو روی سطح ثابت، کمر صاف', 'دمبل را با دست دیگر به سمت پهلو بکش', 'بدن تاب نخورد، فقط بازو حرکت کند'] },
  band_kickback: { name: 'ضربه پا به عقب با کش (باسن)', equipment: ['کش مقاومتی'], category: 'strength',
    video: 'https://www.youtube.com/watch?v=qnllnxtCP2s',
    cues: ['کش رو پایین درب (نزدیک زمین) انکر کن و بند مچ‌پا رو به یک پا ببند', 'با دست به دیوار یا در تکیه بده، پای بسته‌شده رو مستقیم و کنترل‌شده به عقب بکش', 'در انتها باسن رو منقبض کن، زانو زیاد خم نشه'] },
  lateral_raise: { name: 'نشر جانب دمبل', equipment: ['دمبل'], category: 'strength',
    video: 'https://www.youtube.com/watch?v=ssAo_xwFt5c',
    cues: ['دمبل سبک انتخاب کن', 'دست‌ها را تا ارتفاع شانه از پهلو بالا ببر', 'کمی آرنج خم باشد، شانه‌ها بالا نیاید'] },

  plank: { name: 'پلانک', equipment: ['مت'], category: 'core',
    video: 'https://www.youtube.com/watch?v=mwlp75MS6Rg',
    cues: ['از آرنج و نوک پا تکیه بده، بدن یک خط صاف', 'شکم و باسن منقبض بماند', 'کمر گود یا قوس نشود'] },
  bicycle_crunch: { name: 'کرانچ دوچرخه', equipment: ['مت'], category: 'core',
    video: 'https://www.youtube.com/watch?v=PAEo-zRSanM',
    cues: ['دست‌ها کنار سر، زانوها ۹۰ درجه بالا', 'آرنج مخالف را به زانوی مخالف نزدیک کن', 'آهسته و کنترل‌شده، نه سریع'] },
  mountain_climber: { name: 'مانتین کلایمبر', equipment: ['مت'], category: 'cardio',
    video: 'https://www.youtube.com/watch?v=ZhiCSdOVJp0',
    cues: ['در پلانک بالای دست بایست', 'زانوها را متناوب و سریع به سینه بکش', 'شکم منقبض بماند تا کمر افت نکند'] },
  leg_raise: { name: 'بالا آوردن پا خوابیده', equipment: ['مت'], category: 'core',
    video: 'https://www.youtube.com/watch?v=cHKq6h0hANQ',
    cues: ['روی مت به پشت دراز بکش، دست‌ها کنار بدن یا زیر باسن', 'پاها صاف و جفت، تا ۹۰ درجه بالا ببر', 'کمر را کاملاً روی زمین نگه دار'] },
  jumping_jack: { name: 'جامپینگ جک', equipment: ['بدون وسیله'], category: 'cardio',
    video: 'https://www.youtube.com/watch?v=uLVt6u15L98',
    cues: ['بایست، پاها جفت و دست‌ها کنار بدن', 'همزمان پاها رو باز کن و دست‌ها رو بالای سر بزن', 'ریتم ثابت و تنفس منظم داشته باش'] },
  squat_jump: { name: 'اسکوات پرشی', equipment: ['بدون وسیله'], category: 'cardio',
    video: 'https://www.youtube.com/watch?v=tZSYZdtbONc',
    cues: ['یه اسکوات معمولی بدون وزنه انجام بده', 'از پایین اسکوات با قدرت بپر بالا', 'فرود نرم روی هر دو پا، دوباره اسکوات کن'] },
  plank_shoulder_tap: { name: 'پلانک با لمس شانه', equipment: ['مت'], category: 'core',
    video: 'https://www.youtube.com/watch?v=eT93C-xUZI8',
    cues: ['در پلانک دست باز قرار بگیر', 'هر بار یک دست را به شانه مخالف بزن', 'لگن ثابت بماند و تاب نخورد'] },
  reverse_crunch: { name: 'کرانچ معکوس', equipment: ['مت'], category: 'core',
    video: 'https://www.youtube.com/watch?v=XY8KzdDcMFg',
    cues: ['به پشت دراز بکش، زانوها ۹۰ درجه بالا', 'با فشار شکم، باسن را کمی از زمین جدا کن', 'حرکت کوچک و کنترل‌شده، بدون تاب پا'] },
  side_plank: { name: 'پلانک جانبی', equipment: ['مت'], category: 'core',
    video: 'https://www.youtube.com/watch?v=Ujf5ELfqI7o',
    cues: ['روی یک آرنج و لبه پا تکیه بده', 'بدن یک خط صاف، باسن پایین نیفتد', 'دست دیگر رو به سقف باز شود'] },

  bike_recovery: { name: 'رکاب سبک ریکاوری', equipment: ['دوچرخه اسپینینگ'], category: 'cardio',
    video: 'https://www.youtube.com/watch?v=v1-rdXGFzW4',
    cues: ['مقاومت کم، فقط برای باز شدن پاها بعد از هفته سنگین', 'ضربان قلب باید پایین و راحت بماند، نه نفس‌نفس‌زدن', 'روی اپ FitShow ریتم ثابت و آرام را چک کن'] },

  cat_cow: { name: 'کت-کاو', equipment: ['مت'], category: 'recovery',
    video: 'https://www.youtube.com/watch?v=1P_auHRJdNg',
    cues: ['روی چهاردست‌وپا، دم: کمر گود و سر بالا', 'بازدم: کمر قوس و سر پایین', 'هماهنگ با نفس، آهسته'] },
  down_dog_block: { name: 'سگ رو به پایین با بلوک', equipment: ['مت', 'بلوک یوگا'], category: 'recovery',
    video: 'https://www.youtube.com/watch?v=wWL5WsjjaBY',
    cues: ['دست‌ها روی بلوک (اگر مچ درد دارد) یا زمین', 'باسن رو به بالا و عقب، پاشنه به سمت زمین', 'ستون فقرات را بکش و طولانی کن'] },
  pigeon_block: { name: 'کبوتر با بلوک', equipment: ['مت', 'بلوک یوگا'], category: 'recovery',
    video: 'https://www.youtube.com/watch?v=BzlbEwA9-kg',
    cues: ['یک زانو جلو و باز، پای دیگر صاف عقب', 'بلوک زیر باسن طرف خم برای حمایت', 'برای کشش عمیق، کمی جلو خم شو'] },
  seated_fold_block: { name: 'خم‌شدن نشسته با بلوک', equipment: ['مت', 'بلوک یوگا'], category: 'recovery',
    video: 'https://www.youtube.com/watch?v=lhDSw1S5SUM',
    cues: ['بنشین، پاها صاف جلو', 'از لگن خم شو، دست‌ها را روی بلوک تکیه بده', 'فشار نیاور، فقط کشش ملایم'] },
  hip_flexor_stretch: { name: 'کشش فلکسور لگن', equipment: ['مت'], category: 'recovery',
    video: 'https://www.youtube.com/watch?v=6o-GpPIGR5w',
    cues: ['زانو بزن، یک پا جلو با زاویه ۹۰ درجه', 'لگن را آرام به جلو فشار بده', 'جلوی ران پای عقب کشیده می‌شود'] },
  childs_pose: { name: 'حالت کودک', equipment: ['مت'], category: 'recovery',
    video: 'https://www.youtube.com/watch?v=EniGBCHAEVQ',
    cues: ['زانو بزن، باسن روی پاشنه بنشین', 'دست‌ها جلو دراز، پیشانی روی مت', 'نفس عمیق و ریلکس کامل'] },

  dead_bug: { name: 'ددباگ', equipment: ['مت'], category: 'core',
    video: 'https://www.youtube.com/watch?v=bxn9FBrt4-A',
    cues: ['به پشت دراز بکش، دست‌ها بالای شانه و زانوها ۹۰ درجه بالا', 'کمر رو محکم به زمین بچسبون (بدون فاصله)', 'همزمان یک دست و پای مخالف رو کشیده به سمت پایین ببر، بدون اینکه کمر از زمین جدا بشه'] },
  bird_dog: { name: 'پرنده-سگ', equipment: ['مت'], category: 'core',
    video: 'https://www.youtube.com/watch?v=ZdAHe9_HeEw',
    cues: ['روی چهاردست‌وپا، کمر صاف و شکم منقبض', 'همزمان یک دست و پای مخالف رو صاف و هم‌خط با بدن باز کن', 'لگن نچرخه، کمر گود نشه؛ کنترل‌شده برگردون'] },
  pelvic_tilt: { name: 'چرخش لگن به عقب', equipment: ['مت'], category: 'core',
    video: 'https://www.youtube.com/watch?v=Q59R9p4rzxw',
    cues: ['به پشت دراز بکش، زانو خم و کف پا روی زمین', 'با فشار شکم، کمر رو به زمین بچسبون و لگن رو کمی به عقب بچرخون', 'چند ثانیه نگه دار، بدون حبس نفس، آروم برگردون'] },
  bw_glute_bridge: { name: 'پل باسن (بدون وزنه)', equipment: ['مت'], category: 'core',
    video: 'https://www.youtube.com/watch?v=8bbE64NuDTU',
    cues: ['به پشت دراز بکش، زانو خم و کف پا نزدیک باسن', 'با فشار پاشنه، لگن رو بالا ببر تا از شانه تا زانو یک خط بشه', 'در بالا باسن رو محکم منقبض کن، کمر قوس نکنه'] },
};

/* ---------- بلوک اختیاری اصلاح گودی کمر (هر روز در دسترس) ---------- */
const CORRECTIVE_BLOCK = {
  key: 'CORR',
  title: 'اصلاحی گودی کمر (اختیاری)',
  items: [
    { ex: 'dead_bug', sets: 3, reps: '۱۰ هر طرف', restSec: 30 },
    { ex: 'bird_dog', sets: 3, reps: '۱۰ هر طرف', restSec: 30 },
    { ex: 'pelvic_tilt', sets: 2, reps: '۱۲', restSec: 30 },
    { ex: 'bw_glute_bridge', sets: 3, reps: '۱۵', restSec: 30 },
  ],
};

/* ---------- 3-day program (≤45 دقیقه هر جلسه) ---------- */
const DAY_PLANS = [
  { key: 'A', title: 'تمام‌بدن ۱ + شکم', category: 'strength', estMinutes: 38,
    warmup: ['۳ دقیقه گرم کردن: چرخش شانه، کشش سینه با کش، ۱۰ چمباتمه بدون وزنه'],
    blocks: [
      { title: 'حرکات اصلی', items: [
        { ex: 'goblet_squat', sets: 3, reps: '۱۲', restSec: 60 },
        { ex: 'floor_press', sets: 3, reps: '۱۲', restSec: 60 },
        { ex: 'bent_row', sets: 3, reps: '۱۲', restSec: 60 },
        { ex: 'band_overhead_press', sets: 3, reps: '۱۵', restSec: 45 },
        { ex: 'rdl', sets: 3, reps: '۱۲', restSec: 60 },
      ] },
      { title: 'فینیشر شکم', items: [
        { ex: 'plank', sets: 3, reps: '۴۰ ثانیه', restSec: 30, durationSec: 40 },
        { ex: 'bicycle_crunch', sets: 3, reps: '۲۰', restSec: 30 },
      ] },
    ], cooldown: ['۲ دقیقه کشش سینه، پشت‌بازو و شانه'] },

  { key: 'B', title: 'کاردیوی متابولیک + شکم', category: 'cardio', estMinutes: 36,
    warmup: ['۳ دقیقه گرم کردن: چرخش مفاصل + جامپینگ جک سبک'],
    blocks: [
      { title: 'سیرکویت کاردیو (۳ ست هر حرکت)', items: [
        { ex: 'jumping_jack', sets: 3, reps: '۴۰ ثانیه', restSec: 30, durationSec: 40 },
        { ex: 'mountain_climber', sets: 3, reps: '۳۰ ثانیه', restSec: 30, durationSec: 30 },
        { ex: 'squat_jump', sets: 3, reps: '۱۵', restSec: 30 },
        { ex: 'walking_lunge', sets: 3, reps: '۱۲ هر پا', restSec: 30 },
      ] },
      { title: 'شکم', items: [
        { ex: 'leg_raise', sets: 3, reps: '۱۵', restSec: 30 },
        { ex: 'plank_shoulder_tap', sets: 3, reps: '۳۰ ثانیه', restSec: 30, durationSec: 30 },
      ] },
    ], cooldown: ['۵ دقیقه کشش کلی بدن و تنفس آرام'] },

  { key: 'C', title: 'تمام‌بدن ۲ + شکم', category: 'strength', estMinutes: 38,
    warmup: ['۳ دقیقه گرم کردن: لانژ سبک بدون وزنه، چرخش لگن، کت-کاو'],
    blocks: [
      { title: 'حرکات اصلی', items: [
        { ex: 'walking_lunge', sets: 3, reps: '۱۲ هر پا', restSec: 60 },
        { ex: 'band_chest_press', sets: 3, reps: '۱۵', restSec: 45 },
        { ex: 'single_arm_row', sets: 3, reps: '۱۲ هر دست', restSec: 60 },
        { ex: 'band_kickback', sets: 3, reps: '۱۲ هر پا', restSec: 45 },
        { ex: 'lateral_raise', sets: 3, reps: '۱۵', restSec: 45 },
      ] },
      { title: 'فینیشر شکم', items: [
        { ex: 'reverse_crunch', sets: 3, reps: '۱۵', restSec: 30 },
        { ex: 'side_plank', sets: 3, reps: '۳۰ ثانیه هر طرف', restSec: 30, durationSec: 30 },
      ] },
    ], cooldown: ['۲ دقیقه کشش چهارسر ران، همسترینگ و باسن'] },
];

/* ---------- روزهای اختیاری پنج‌شنبه/جمعه (ریکاوری فعال) ---------- */
const BONUS_PLANS = {
  4: { key: 'D', title: 'دوچرخه سبک (ریکاوری فعال)', category: 'cardio', optional: true, estMinutes: 25,
    warmup: ['۳ دقیقه رکاب بسیار آرام برای باز شدن مفاصل'],
    blocks: [
      { title: 'رکاب ریکاوری', items: [ { ex: 'bike_recovery', sets: '۱ جلسه', reps: '۲۰-۲۵ دقیقه با ضربان پایین و راحت', single: true } ] },
    ], cooldown: ['۵ دقیقه کشش ساق پا و جلوی ران'] },

  5: { key: 'E', title: 'یوگا و انعطاف‌پذیری', category: 'recovery', optional: true, estMinutes: 25,
    warmup: [],
    blocks: [
      { title: 'فلوی یوگا', items: [
        { ex: 'cat_cow', sets: 2, reps: '۸ نفس', restSec: 30 },
        { ex: 'down_dog_block', sets: 3, reps: '۳۰-۴۵ ثانیه', restSec: 30, durationSec: 40 },
        { ex: 'pigeon_block', sets: 2, reps: '۴۵ ثانیه هر طرف', restSec: 30, durationSec: 45 },
        { ex: 'seated_fold_block', sets: 2, reps: '۴۵ ثانیه', restSec: 30, durationSec: 45 },
        { ex: 'hip_flexor_stretch', sets: 2, reps: '۳۰ ثانیه هر طرف', restSec: 30, durationSec: 30 },
        { ex: 'childs_pose', sets: 1, reps: '۱ دقیقه', restSec: 0, durationSec: 60 },
      ] },
    ], cooldown: ['۳ دقیقه تنفس عمیق برای آرام کردن سیستم عصبی'] },
};

const PROGRESSION_NOTES = [
  'هفته ۱ — آشنایی: وزنه‌ها را سبک انتخاب کن و روی فرم صحیح تمرکز کن. HIIT: اسپرینت ۲۰ ثانیه / ریکاوری ۱۰۰ ثانیه.',
  'هفته ۲: وزن دمبل‌ها را یک پله بالا ببر. HIIT را به اسپرینت ۳۰ ثانیه / ریکاوری ۹۰ ثانیه برسان.',
  'هفته ۳: یک ست اضافه به حرکات اصلی اضافه کن یا تکرارها را به سقف بازه برسان. HIIT: اسپرینت ۴۰ ثانیه / ریکاوری ۸۰ ثانیه.',
  'هفته ۴ — اوج چرخه: سنگین‌ترین وزنه ممکن با فرم درست. HIIT: اسپرینت ۴۵ ثانیه / ریکاوری ۷۵ ثانیه. بعد از این هفته دوباره از هفته ۱ با وزنه‌های جدید شروع کن.',
];

const NUTRITION_TIP = 'دیده‌شدن شش‌پک حدود ۷۰٪ به تغذیه بستگی دارد: کسری کالری ملایم (۳۰۰-۵۰۰ کیلوکالری کمتر از نیاز روزانه)، پروتئین ۱٫۶ تا ۲ گرم به‌ازای هر کیلوگرم وزن بدن (برای ۷۰ کیلوگرم یعنی حدود ۱۱۰-۱۴۰ گرم در روز)، آب کافی و خواب ۷-۸ ساعته را جدی بگیر.';

/* ---------- state ---------- */
const KEYS = {
  theme: 'fc_theme', start: 'fc_start_date', weight: 'fc_weight', height: 'fc_height',
  completed: 'fc_completed_dates', checked: 'fc_checked_ex', weightLog: 'fc_weight_log',
  workoutDays: 'fc_workout_days',
};
const state = { view: 'today' };

function getWorkoutDaysSorted() {
  const stored = readJSON(KEYS.workoutDays, [6, 1, 3]);
  return [...stored].sort((a, b) => PERSIAN_WEEK_JSDAYS.indexOf(a) - PERSIAN_WEEK_JSDAYS.indexOf(b));
}
function planForJsDay(jsDay) {
  const days = getWorkoutDaysSorted();
  const idx = days.indexOf(jsDay);
  if (idx !== -1 && idx < DAY_PLANS.length) return DAY_PLANS[idx];
  if (BONUS_PLANS[jsDay]) return BONUS_PLANS[jsDay];
  return null;
}
function restPlan() {
  return { key: 'rest', title: 'استراحت کامل', category: 'rest', warmup: [], blocks: [], cooldown: [],
    note: 'استراحت کامل یا ۱۰ دقیقه کشش سبک با مت و بلوک یوگا کافیه.' };
}
function todayPlan() { return planForJsDay(new Date().getDay()) || restPlan(); }

function getStartDate() {
  let v = localStorage.getItem(KEYS.start);
  if (!v) { v = todayISO(); localStorage.setItem(KEYS.start, v); }
  return v;
}
function getCycleWeek() {
  const start = new Date(getStartDate() + 'T00:00:00');
  const now = new Date(todayISO() + 'T00:00:00');
  const diffDays = Math.max(0, Math.round((now - start) / 86400000));
  return (Math.floor(diffDays / 7) % 4) + 1;
}
function getCompletedEntries() {
  // each entry: { date: 'yyyy-mm-dd', time: 'HH:MM' } — old plain-string entries (pre-timestamp) are normalized on read
  return readJSON(KEYS.completed, []).map((e) => (typeof e === 'string' ? { date: e, time: null } : e));
}
function getCompletedDates() { return getCompletedEntries().map((e) => e.date); }
function getCompletedDateSet() { return new Set(getCompletedDates()); }
function toggleCompletedToday() {
  const entries = getCompletedEntries();
  const t = todayISO();
  const idx = entries.findIndex((e) => e.date === t);
  if (idx >= 0) {
    entries.splice(idx, 1);
  } else {
    const now = new Date();
    entries.push({ date: t, time: pad2(now.getHours()) + ':' + pad2(now.getMinutes()) });
  }
  writeJSON(KEYS.completed, entries);
}
function isTodayCompleted() { return getCompletedDateSet().has(todayISO()); }
function getTodayCompletionTime() {
  const entry = getCompletedEntries().find((e) => e.date === todayISO());
  return entry ? entry.time : null;
}
function getCurrentStreak() {
  const set = getCompletedDateSet();
  let streak = 0;
  let d = new Date();
  if (!set.has(todayISO(d))) d.setDate(d.getDate() - 1);
  while (set.has(todayISO(d))) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}
function getCheckedMap() { return readJSON(KEYS.checked, {}); }

/* ---------- toast ---------- */
let toastTimer = null;
function toast(msg) {
  let t = document.getElementById('toast');
  if (!t) { t = el('div', 'toast'); t.id = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
}

/* ---------- chime sound (Web Audio, no asset files) ---------- */
let sharedAudioCtx = null;
function primeAudioCtx() {
  if (sharedAudioCtx) return;
  try { sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch { /* no audio support */ }
}
function playChime() {
  if (!sharedAudioCtx) return;
  try {
    if (sharedAudioCtx.state === 'suspended') sharedAudioCtx.resume();
    const t0 = sharedAudioCtx.currentTime;
    [ [880, 0], [1318.5, 0.11] ].forEach(([freq, delay]) => {
      const o = sharedAudioCtx.createOscillator();
      const g = sharedAudioCtx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, t0 + delay);
      g.gain.setValueAtTime(0.0001, t0 + delay);
      g.gain.exponentialRampToValueAtTime(0.35, t0 + delay + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + delay + 0.45);
      o.connect(g); g.connect(sharedAudioCtx.destination);
      o.start(t0 + delay);
      o.stop(t0 + delay + 0.5);
    });
  } catch { /* ignore playback failures */ }
}

/* ---------- active bar: shared work/rest timer, Hevy-style ---------- */
/* Timestamp-based (not a naive per-tick counter) so background tab throttling
   never "freezes" the display — visibilitychange forces an immediate resync. */
let activeBarState = null; // { endTime, timerId, mode: 'work'|'rest', onDone }

function clearActiveBar() {
  if (activeBarState) clearInterval(activeBarState.timerId);
  activeBarState = null;
  const bar = document.getElementById('rest-bar');
  if (bar) { bar.hidden = true; bar.classList.remove('mode-work'); }
}
function updateActiveBarClock(remaining) {
  const c = document.getElementById('rest-bar-clock');
  if (c) c.textContent = toFa(pad2(Math.floor(remaining / 60))) + ':' + toFa(pad2(remaining % 60));
}
function tickActiveBar() {
  if (!activeBarState) return;
  const remaining = Math.max(0, Math.ceil((activeBarState.endTime - Date.now()) / 1000));
  if (remaining <= 0) {
    const onDone = activeBarState.onDone;
    const mode = activeBarState.mode;
    if (navigator.vibrate) navigator.vibrate(mode === 'work' ? [120, 80, 120] : 200);
    playChime();
    clearActiveBar();
    if (onDone) onDone();
    return;
  }
  updateActiveBarClock(remaining);
  if (remaining <= 3 && navigator.vibrate) navigator.vibrate(50);
}
function showActiveBar(seconds, label, mode, onDone) {
  clearActiveBar();
  const bar = document.getElementById('rest-bar');
  bar.hidden = false;
  bar.classList.toggle('mode-work', mode === 'work');
  bar.innerHTML = `
    <div class="rest-bar-info">
      <div class="rest-bar-label">${label}</div>
      <div class="rest-bar-clock tabular mono" id="rest-bar-clock"></div>
    </div>
    <div class="rest-bar-actions">
      ${mode === 'rest' ? '<button class="btn btn-ghost btn-sm" id="rest-plus">+۱۵</button>' : ''}
      <button class="btn btn-secondary btn-sm" id="rest-skip">${mode === 'work' ? 'پایان زودتر' : 'رد کردن'}</button>
    </div>`;
  activeBarState = { endTime: Date.now() + seconds * 1000, timerId: null, mode, onDone };
  updateActiveBarClock(seconds);
  document.getElementById('rest-skip').addEventListener('click', () => {
    const finishedWork = activeBarState && activeBarState.mode === 'work';
    const cb = activeBarState && activeBarState.onDone;
    clearActiveBar();
    if (finishedWork && cb) cb();
  });
  const plusBtn = document.getElementById('rest-plus');
  if (plusBtn) plusBtn.addEventListener('click', () => { activeBarState.endTime += 15000; tickActiveBar(); });
  activeBarState.timerId = setInterval(tickActiveBar, 250);
}
function showRestBar(seconds, label) { showActiveBar(seconds, label, 'rest', null); }
document.addEventListener('visibilitychange', () => { if (!document.hidden) tickActiveBar(); });

/* ---------- render: badge ---------- */
function badgeHtml(category) {
  return `<span class="badge badge-${category}"><span class="badge-dot"></span>${CAT_LABEL[category] || ''}</span>`;
}

/* ---------- render: exercise card with per-set checkboxes ---------- */
function buildSetRowsHtml(item, planKey, dateKey) {
  const meta = EXERCISES[item.ex];
  const checkedMap = getCheckedMap();
  let rows = '';
  for (let i = 1; i <= item.sets; i++) {
    const key = `${dateKey}_${planKey}_${item.ex}_${i}`;
    const checked = !!checkedMap[key];
    const label = `${meta.name} · ست ${toFa(i)}`;
    const timerBtn = item.durationSec
      ? `<button class="set-timer-btn" data-action="start-work-timer" data-setkey="${key}" data-duration="${item.durationSec}" data-rest="${item.restSec || 0}" data-label="${label}" aria-label="شروع تایمر">${ICONS.play}</button>`
      : '';
    rows += `
    <div class="set-row ${checked ? 'checked' : ''}">
      <button class="set-check ${checked ? 'checked' : ''}" data-action="toggle-set" data-setkey="${key}" data-rest="${item.restSec || 0}" data-label="${label}">${ICONS.check}</button>
      <span class="set-num tabular">ست ${toFa(i)}</span>
      <span class="set-target">${item.reps}</span>
      ${timerBtn}
    </div>`;
  }
  return rows;
}
function buildExerciseCard(item, planKey, dateKey) {
  const meta = EXERCISES[item.ex];
  const wrap = el('div', 'exercise-card');
  wrap.style.setProperty('--cat-color', `var(--cat-${meta.category})`);
  const cuesKey = `${planKey}_${item.ex}`;
  wrap.innerHTML = `
    <div class="row-between">
      <div>
        <div class="ex-name">${meta.name}</div>
        <div class="ex-sub">${toFa(item.sets)} ست × ${item.reps}${item.restSec ? ' · استراحت ' + toFa(item.restSec) + ' ثانیه' : ''}</div>
      </div>
      <button class="icon-btn" style="width:28px;height:28px" data-action="toggle-cues" data-exkey="${cuesKey}">${ICONS.chevron}</button>
    </div>
    <div class="ex-links">
      <a class="video-link" href="${meta.video}" target="_blank" rel="noopener noreferrer">${ICONS.play} ویدیوی آموزشی</a>
      ${badgeHtml(meta.category)}
    </div>
    <div class="ex-cues" data-cues="${cuesKey}"><ul>${meta.cues.map((c) => `<li>${c}</li>`).join('')}</ul></div>
    <div class="set-list">${buildSetRowsHtml(item, planKey, dateKey)}</div>
  `;
  return wrap;
}
function buildHiitCard(item) {
  const meta = EXERCISES[item.ex];
  const wrap = el('div', 'exercise-card');
  wrap.style.setProperty('--cat-color', `var(--cat-${meta.category})`);
  wrap.innerHTML = `
    <div class="ex-name">${meta.name}</div>
    <div class="ex-sub">${item.sets} · ${item.reps}</div>
    <div class="ex-links">
      <a class="video-link" href="${meta.video}" target="_blank" rel="noopener noreferrer">${ICONS.play} ویدیوی آموزشی</a>
      ${badgeHtml(meta.category)}
    </div>
  `;
  return wrap;
}

/* ================= views ================= */
function renderToday() {
  const plan = todayPlan();
  const now = new Date();
  const cat = plan.category;
  const dateKey = todayISO();
  const wrap = el('div', 'stack');

  const week = el('div', 'week-pill-row');
  PERSIAN_WEEK_JSDAYS.forEach((jsDay) => {
    const p = planForJsDay(jsDay);
    const isToday = jsDay === now.getDay();
    const pill = el('div', `week-pill ${isToday ? 'is-today' : ''}`);
    const c = p ? p.category : 'rest';
    const label = p ? p.title.split(' ')[0].slice(0, 4) : 'استر';
    pill.innerHTML = `<span class="wp-dot" style="background:var(--cat-${c === 'rest' ? 'strength' : c})"></span>${label}`;
    week.appendChild(pill);
  });
  wrap.appendChild(week);

  const hero = el('div', 'hero-day');
  hero.style.setProperty('--cat-color', cat === 'rest' ? 'var(--text-muted)' : `var(--cat-${cat})`);
  hero.innerHTML = `
    <div class="row-between">
      <div class="row" style="gap:6px">
        ${badgeHtml(cat)}
        ${plan.optional ? '<span class="badge badge-rest">اختیاری</span>' : ''}
      </div>
      <span class="ex-sub">${plan.estMinutes ? '~' + toFa(plan.estMinutes) + ' دقیقه' : ''}${plan.optional ? '' : ' · هفته ' + toFa(getCycleWeek()) + ' از ۴'}</span>
    </div>
    <h2>${weekdayName(now)} · ${plan.title}</h2>
    ${plan.optional ? `<p class="hero-desc">این جلسه اختیاریه — یه ریکاوری سبک بین برنامه‌های اصلیه، هر وقت حال و وقتش رو داشتی انجامش بده.</p>` : ''}
    ${plan.note ? `<p class="hero-desc">${plan.note}</p>` : ''}
    ${plan.warmup && plan.warmup.length ? `<p class="hero-desc"><strong>گرم کردن:</strong> ${plan.warmup.join(' ')}</p>` : ''}
  `;
  wrap.appendChild(hero);

  if (cat !== 'rest') {
    if (!plan.optional) {
      const progCard = el('div', 'card');
      progCard.innerHTML = `<div class="section-title">برنامه این هفته</div><p style="margin-top:8px;font-size:13.5px;color:var(--text-secondary)">${PROGRESSION_NOTES[getCycleWeek() - 1]}</p>`;
      wrap.appendChild(progCard);
    }

    plan.blocks.forEach((block) => {
      const card = el('div', 'card');
      card.appendChild(el('div', 'section-title', block.title));
      const inner = el('div');
      inner.style.marginTop = '10px';
      block.items.forEach((item) => {
        inner.appendChild((item.isHiit || item.single) ? buildHiitCard(item) : buildExerciseCard(item, plan.key, dateKey));
      });
      card.appendChild(inner);
      wrap.appendChild(card);
    });

    if (plan.cooldown.length) {
      const cd = el('div', 'card');
      cd.innerHTML = `<div class="section-title">سرد کردن</div><p style="margin-top:8px;font-size:13.5px;color:var(--text-secondary)">${plan.cooldown.join(' ')}</p>`;
      wrap.appendChild(cd);
    }
  }

  const corrCard = el('div', 'card');
  const corrDetails = el('details', 'collapsible');
  const corrSummary = el('summary', '', CORRECTIVE_BLOCK.title);
  corrDetails.appendChild(corrSummary);
  const corrBody = el('div');
  corrBody.style.marginTop = '10px';
  corrBody.innerHTML = `<p style="font-size:12.5px;color:var(--text-secondary);margin-bottom:10px">هر وقت خواستی — مستقل از برنامه‌ی امروز — برای کمک به رفع گودی کمر (لوردوز) قابل انجامه.</p>`;
  CORRECTIVE_BLOCK.items.forEach((item) => {
    corrBody.appendChild(buildExerciseCard(item, CORRECTIVE_BLOCK.key, dateKey));
  });
  corrDetails.appendChild(corrBody);
  corrCard.appendChild(corrDetails);
  wrap.appendChild(corrCard);

  const completionTime = getTodayCompletionTime();
  const doneBtn = el('button', `btn btn-block ${isTodayCompleted() ? 'btn-secondary' : 'btn-primary'}`);
  doneBtn.innerHTML = isTodayCompleted()
    ? `${ICONS.check} تمرین امروز${completionTime ? ' ساعت ' + toFa(completionTime) : ''} انجام شد`
    : 'ثبت پایان تمرین امروز';
  doneBtn.addEventListener('click', () => {
    toggleCompletedToday();
    const t = getTodayCompletionTime();
    toast(isTodayCompleted() ? `دمت گرم!${t ? ' ساعت ' + toFa(t) : ''} ثبت شد 💪` : 'لغو شد');
    renderView();
  });
  wrap.appendChild(doneBtn);

  return wrap;
}

function renderWeek() {
  const wrap = el('div', 'stack');
  const info = el('div', 'card');
  info.innerHTML = `<div class="section-title">برنامه ۴ هفته‌ای · ۳ روز در هفته</div><p style="margin-top:8px;font-size:13.5px;color:var(--text-secondary)">${PROGRESSION_NOTES[getCycleWeek() - 1]}</p>`;
  wrap.appendChild(info);

  const todayJs = new Date().getDay();
  PERSIAN_WEEK_JSDAYS.forEach((jsDay) => {
    const plan = planForJsDay(jsDay);
    const card = el('div', 'card day-card');
    const isToday = jsDay === todayJs;
    let summary = 'روز استراحت — می‌تونی سبک کشش کنی';
    let title = 'استراحت';
    let cat = 'rest';
    let est = '';
    if (plan) {
      title = plan.title; cat = plan.category; est = plan.estMinutes ? `~${toFa(plan.estMinutes)} دقیقه · ` : '';
      summary = est + plan.blocks.map((b) => `${b.title}: ${b.items.length === 1 && typeof b.items[0].sets === 'string' ? b.items[0].sets : toFa(b.items.length) + ' حرکت'}`).join(' · ');
    }
    card.innerHTML = `
      <div class="day-card-head">
        <div>
          <div class="day-card-title">${PERSIAN_WEEKDAYS[jsDay]}${isToday ? ' · امروز' : ''}</div>
          <div class="day-card-sub">${title}${plan && plan.optional ? ' · اختیاری' : ''}</div>
        </div>
        ${badgeHtml(cat)}
      </div>
      <hr class="hairline" />
      <div class="day-card-items">${summary}</div>
    `;
    wrap.appendChild(card);
  });
  return wrap;
}

function renderLibrary() {
  const wrap = el('div', 'stack');
  const filters = ['همه', 'دمبل', 'کش مقاومتی', 'دوچرخه اسپینینگ', 'مت'];
  const frow = el('div', 'filter-row');
  filters.forEach((f, i) => {
    const chip = el('button', `chip ${i === 0 ? 'active' : ''}`);
    chip.textContent = f;
    chip.dataset.filter = f;
    frow.appendChild(chip);
  });
  wrap.appendChild(frow);

  const grid = el('div', 'lib-grid');
  wrap.appendChild(grid);

  function draw(filter) {
    grid.innerHTML = '';
    Object.entries(EXERCISES).forEach(([id, meta]) => {
      if (filter !== 'همه' && !meta.equipment.includes(filter)) return;
      const primaryEquip = meta.equipment[0];
      const card = el('div', 'card lib-card');
      card.style.setProperty('--cat-color', `var(--cat-${meta.category})`);
      card.style.setProperty('--cat-wash', `var(--cat-${meta.category}-wash)`);
      card.innerHTML = `
        <div class="row">
          <div class="lib-icon">${EQUIP_ICON[primaryEquip] || ICONS.dumbbell}</div>
          <div>
            <div class="lib-name">${meta.name}</div>
            <div class="lib-equipment">${meta.equipment.join('، ')}</div>
          </div>
        </div>
        <div class="ex-links">
          <a class="video-link" href="${meta.video}" target="_blank" rel="noopener noreferrer">${ICONS.play} ویدیو</a>
        </div>
        <div class="row-between">
          ${badgeHtml(meta.category)}
          <button class="icon-btn" style="width:26px;height:26px" data-action="toggle-lib" data-exid="${id}">${ICONS.chevron}</button>
        </div>
        <div class="lib-detail" data-libdetail="${id}"><ul style="margin:0;padding-inline-start:18px;font-size:12.5px;color:var(--text-secondary);display:flex;flex-direction:column;gap:4px">${meta.cues.map((c) => `<li>${c}</li>`).join('')}</ul></div>
      `;
      grid.appendChild(card);
    });
  }
  draw('همه');
  frow.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    frow.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
    btn.classList.add('active');
    draw(btn.dataset.filter);
  });
  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="toggle-lib"]');
    if (!btn) return;
    const detail = grid.querySelector(`[data-libdetail="${btn.dataset.exid}"]`);
    detail.classList.toggle('open');
    btn.style.transform = detail.classList.contains('open') ? 'rotate(180deg)' : '';
  });
  return wrap;
}

function weightChartSvg(log) {
  if (log.length < 2) return `<div class="chart-empty">برای دیدن نمودار، حداقل ۲ بار وزن ثبت کن.</div>`;
  const sorted = [...log].sort((a, b) => a.date.localeCompare(b.date));
  const w = Math.max(300, sorted.length * 46);
  const h = 150, padL = 34, padR = 14, padT = 14, padB = 24;
  const vals = sorted.map((p) => p.kg);
  const min = Math.min(...vals) - 1, max = Math.max(...vals) + 1;
  const x = (i) => padL + (i * (w - padL - padR)) / (sorted.length - 1);
  const y = (v) => padT + (h - padT - padB) * (1 - (v - min) / (max - min));
  const pathD = sorted.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.kg).toFixed(1)}`).join(' ');
  const gridY = [min, (min + max) / 2, max];
  let svg = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="نمودار روند وزن">`;
  gridY.forEach((v) => {
    svg += `<line x1="${padL}" y1="${y(v).toFixed(1)}" x2="${w - padR}" y2="${y(v).toFixed(1)}" stroke="var(--gridline)" stroke-width="1"/>`;
    svg += `<text x="${padL - 8}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end" font-size="10.5" fill="var(--text-muted)" font-family="var(--font-mono)">${toFa(v.toFixed(1))}</text>`;
  });
  svg += `<path d="${pathD}" fill="none" stroke="var(--cat-strength)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  sorted.forEach((p, i) => {
    const last = i === sorted.length - 1;
    svg += `<circle cx="${x(i).toFixed(1)}" cy="${y(p.kg).toFixed(1)}" r="${last ? 5.5 : 3.5}" fill="${last ? 'var(--cat-strength)' : 'var(--surface)'}" stroke="var(--cat-strength)" stroke-width="2"/>`;
  });
  svg += `</svg>`;
  return svg;
}

/* ---------- training calendar (Hevy-style: done / missed / upcoming) ---------- */
function getMostRecentSaturday(d) {
  const diff = (d.getDay() - 6 + 7) % 7;
  const r = new Date(d);
  r.setDate(r.getDate() - diff);
  r.setHours(0, 0, 0, 0);
  return r;
}
function buildCalendar(numWeeks) {
  const completed = getCompletedDateSet();
  const entriesByDate = {};
  getCompletedEntries().forEach((e) => { entriesByDate[e.date] = e; });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentWeekStart = getMostRecentSaturday(today);

  const wrap = el('div');
  // Header must mirror the exact flex skeleton of a .cal-week-block (empty label-width
  // spacer + the 7-col grid) — it was previously a bare full-width grid while every data
  // row is inset by the label's width, so header columns never lined up with their data.
  const headerBlock = el('div', 'cal-week-block');
  headerBlock.appendChild(el('div', 'cal-week-label', ''));
  const header = el('div', 'cal-weekday-row');
  // Columns are forced to a fixed physical left-to-right order below (Fri...Sat) —
  // some WebViews don't mirror CSS Grid tracks under dir=rtl the way flexbox does,
  // so we render explicit physical order instead of relying on that mirroring.
  ['ج', 'پ', 'چ', 'س', 'د', 'ی', 'ش'].forEach((l) => header.appendChild(el('span', '', l)));
  headerBlock.appendChild(header);
  wrap.appendChild(headerBlock);

  for (let w = 0; w < numWeeks; w++) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(weekStart.getDate() - w * 7);
    const rowWrap = el('div', 'cal-week-block');
    const labelText = w === 0 ? 'این هفته' : w === 1 ? 'هفته قبل' : `${toFa(w)} هفته پیش`;
    rowWrap.appendChild(el('div', 'cal-week-label', labelText));
    const cellsWrap = el('div', 'cal-week-cells');
    for (let c = 6; c >= 0; c--) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + c);
      const iso = todayISO(d);
      const plan = planForJsDay(d.getDay());
      let status = 'none';
      if (plan) {
        if (completed.has(iso)) status = 'done';
        else if (d.getTime() === today.getTime()) status = 'today-pending';
        else if (d.getTime() > today.getTime()) status = 'upcoming';
        else status = 'missed';
      }
      const cell = el('div', `cal-cell ${status}`);
      if (plan) cell.style.setProperty('--cat-color', `var(--cat-${plan.category})`);
      const [, , jd] = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
      const mark = status === 'done' ? '✓' : status === 'missed' ? '×' : '';
      cell.innerHTML = `<span class="cal-daynum">${toFa(jd)}</span>${mark ? `<span class="cal-mark">${mark}</span>` : ''}`;
      const doneTime = entriesByDate[iso] && entriesByDate[iso].time;
      cell.title = `${PERSIAN_WEEKDAYS[d.getDay()]} ${formatShamsi(d)}` + (doneTime ? ` · ساعت ${toFa(doneTime)}` : '');
      cellsWrap.appendChild(cell);
    }
    rowWrap.appendChild(cellsWrap);
    wrap.appendChild(rowWrap);
  }

  const legend = el('div', 'cal-legend');
  legend.innerHTML = `
    <span class="cal-legend-item"><span class="cal-legend-dot" style="background:var(--good)"></span>انجام‌شده</span>
    <span class="cal-legend-item"><span class="cal-legend-dot" style="background:var(--miss)"></span>میس‌شده</span>
    <span class="cal-legend-item"><span class="cal-legend-dot" style="border:1.5px dashed var(--border-strong)"></span>پیش رو</span>
    <span class="cal-legend-item"><span class="cal-legend-dot" style="opacity:.5;border:1.5px dashed var(--border)"></span>بدون برنامه</span>
  `;
  wrap.appendChild(legend);
  return wrap;
}

function buildWeeklyBarChart(numWeeks) {
  const completed = getCompletedDateSet();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentWeekStart = getMostRecentSaturday(today);
  const chart = el('div', 'bar-chart');

  for (let w = 0; w < numWeeks; w++) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(weekStart.getDate() - w * 7);
    let mainCompleted = 0, bonusCompleted = 0;
    for (let c = 0; c < 7; c++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + c);
      if (d.getTime() > today.getTime()) continue;
      const plan = planForJsDay(d.getDay());
      if (plan && completed.has(todayISO(d))) {
        if (plan.optional) bonusCompleted++; else mainCompleted++;
      }
    }
    const pct = Math.max(6, (mainCompleted / 3) * 100);
    const barClass = mainCompleted >= 3 ? 'full' : mainCompleted > 0 ? 'partial' : 'zero';
    const col = el('div', 'bar-col');
    col.innerHTML = `
      <div class="bar-value">${toFa(mainCompleted)}/۳${bonusCompleted ? '+' + toFa(bonusCompleted) : ''}</div>
      <div class="bar-track"><div class="bar ${barClass}" style="height:${pct}%"></div></div>
      <div class="bar-week-label">${w === 0 ? 'این هفته' : `${toFa(w)}ه پیش`}</div>
    `;
    chart.appendChild(col);
  }
  return chart;
}

function renderProgress() {
  const wrap = el('div', 'stack');

  const stats = el('div', 'grid-2');
  const streakTile = el('div', 'card stat-tile');
  streakTile.innerHTML = `<div class="stat-value">${toFa(getCurrentStreak())}</div><div class="stat-label">روز پیاپی تمرین</div>`;
  const totalTile = el('div', 'card stat-tile');
  totalTile.innerHTML = `<div class="stat-value">${toFa(getCompletedDates().length)}</div><div class="stat-label">کل تمرین‌های ثبت‌شده</div>`;
  stats.appendChild(streakTile); stats.appendChild(totalTile);
  wrap.appendChild(stats);

  const barCard = el('div', 'card');
  barCard.innerHTML = `<div class="section-title">ثبات هفتگی (از ۳ تمرین اصلی)</div>`;
  barCard.appendChild(buildWeeklyBarChart(8));
  wrap.appendChild(barCard);

  const calCard = el('div', 'card');
  calCard.innerHTML = `<div class="section-title">تقویم تمرین — این هفته و هفته‌های قبل</div>`;
  const calBody = el('div');
  calBody.style.marginTop = '10px';
  calBody.appendChild(buildCalendar(6));
  calCard.appendChild(calBody);
  wrap.appendChild(calCard);

  const historyEntries = getCompletedEntries().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  if (historyEntries.length) {
    const histCard = el('div', 'card stack');
    histCard.innerHTML = `<div class="section-title">تاریخچه اخیر</div>`;
    const list = el('div', 'stack');
    list.style.gap = '6px';
    historyEntries.forEach((e) => {
      const d = new Date(e.date + 'T00:00:00');
      const plan = planForJsDay(d.getDay());
      const row = el('div', 'row-between');
      row.style.cssText = 'font-size:12.5px;padding:6px 0;border-bottom:1px solid var(--border)';
      row.innerHTML = `
        <span>${PERSIAN_WEEKDAYS[d.getDay()]} ${formatShamsi(d)}${plan ? ' · ' + plan.title : ''}</span>
        <span class="mono tabular" style="color:var(--text-muted)">${e.time ? toFa(e.time) : '—'}</span>
      `;
      list.appendChild(row);
    });
    histCard.appendChild(list);
    wrap.appendChild(histCard);
  }

  const logCard = el('div', 'card stack');
  logCard.innerHTML = `<div class="section-title">روند وزن بدن</div>`;
  const form = el('div', 'log-form');
  form.innerHTML = `<input type="number" step="0.1" min="30" max="250" id="weight-input" placeholder="وزن امروز (کیلوگرم)" />`;
  const addBtn = el('button', 'btn btn-primary btn-sm');
  addBtn.textContent = 'ثبت';
  form.appendChild(addBtn);
  logCard.appendChild(form);
  const chartWrap = el('div', 'chart-wrap');
  const log = readJSON(KEYS.weightLog, []);
  chartWrap.innerHTML = weightChartSvg(log);
  logCard.appendChild(chartWrap);
  addBtn.addEventListener('click', () => {
    const input = document.getElementById('weight-input');
    const kg = parseFloat(input.value);
    if (!kg || kg < 30 || kg > 250) { toast('یک عدد معتبر وارد کن'); return; }
    const list = readJSON(KEYS.weightLog, []);
    const idx = list.findIndex((p) => p.date === todayISO());
    if (idx >= 0) list[idx].kg = kg; else list.push({ date: todayISO(), kg });
    writeJSON(KEYS.weightLog, list);
    localStorage.setItem(KEYS.weight, String(kg));
    toast('ثبت شد');
    renderView();
  });
  wrap.appendChild(logCard);

  const tipCard = el('div', 'card');
  tipCard.innerHTML = `<div class="section-title">نکته تغذیه</div><p style="margin-top:8px;font-size:13.5px;color:var(--text-secondary)">${NUTRITION_TIP}</p>`;
  wrap.appendChild(tipCard);

  return wrap;
}

function renderSettings() {
  const wrap = el('div', 'stack');

  const themeCard = el('div', 'card stack');
  const currentTheme = localStorage.getItem(KEYS.theme) || 'system';
  themeCard.innerHTML = `<div class="section-title">پوسته</div>`;
  const seg = el('div', 'seg');
  [['system', 'سیستم'], ['light', 'روشن'], ['dark', 'تیره']].forEach(([val, label]) => {
    const b = el('button', val === currentTheme ? 'active' : '');
    b.textContent = label; b.dataset.theme = val;
    seg.appendChild(b);
  });
  themeCard.appendChild(seg);
  seg.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    localStorage.setItem(KEYS.theme, b.dataset.theme);
    applyTheme();
    seg.querySelectorAll('button').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
  });
  wrap.appendChild(themeCard);

  const daysCard = el('div', 'card stack');
  daysCard.innerHTML = `<div class="section-title">روزهای تمرین (دقیقاً ۳ روز)</div>`;
  const picker = el('div', 'day-picker');
  daysCard.appendChild(picker);
  const daysNote = el('p');
  daysNote.style.cssText = 'font-size:12.5px;color:var(--text-muted)';
  daysNote.textContent = 'ترتیب روزهای انتخابی در طول هفته، تعیین می‌کند کدوم روز، تمرین ۱، ۲ یا ۳ باشه.';
  daysCard.appendChild(daysNote);
  function drawPicker() {
    const chosen = readJSON(KEYS.workoutDays, [6, 1, 3]);
    picker.innerHTML = '';
    PERSIAN_WEEK_JSDAYS.forEach((jsDay) => {
      const b = el('button', `chip ${chosen.includes(jsDay) ? 'active' : ''}`);
      b.textContent = PERSIAN_WEEKDAYS[jsDay].slice(0, 4);
      b.dataset.jsday = jsDay;
      picker.appendChild(b);
    });
  }
  drawPicker();
  picker.addEventListener('click', (e) => {
    const b = e.target.closest('.chip'); if (!b) return;
    const jsDay = parseInt(b.dataset.jsday, 10);
    let chosen = readJSON(KEYS.workoutDays, [6, 1, 3]);
    if (chosen.includes(jsDay)) {
      chosen = chosen.filter((d) => d !== jsDay);
    } else {
      if (chosen.length >= 3) { toast('فقط ۳ روز — اول یکی رو بردار'); return; }
      chosen.push(jsDay);
    }
    writeJSON(KEYS.workoutDays, chosen);
    drawPicker();
    if (chosen.length === 3) toast('ذخیره شد');
  });
  wrap.appendChild(daysCard);

  const cycleCard = el('div', 'card stack');
  cycleCard.innerHTML = `
    <div class="section-title">چرخه ۴ هفته‌ای</div>
    <div class="field">
      <label>تاریخ شروع برنامه</label>
      <input type="date" id="start-date-input" value="${getStartDate()}" />
    </div>
    <p style="font-size:12.5px;color:var(--text-muted)">هفته فعلی: ${toFa(getCycleWeek())} از ۴ — بعد از هفته ۴ چرخه دوباره از هفته ۱ با وزنه‌های سنگین‌تر شروع می‌شود.</p>
  `;
  wrap.appendChild(cycleCard);
  cycleCard.querySelector('#start-date-input').addEventListener('change', (e) => {
    localStorage.setItem(KEYS.start, e.target.value);
    toast('ذخیره شد'); renderView();
  });

  const bodyCard = el('div', 'card stack');
  const w = localStorage.getItem(KEYS.weight) || '70';
  const h = localStorage.getItem(KEYS.height) || '173';
  const bmi = (parseFloat(w) / Math.pow(parseFloat(h) / 100, 2)).toFixed(1);
  bodyCard.innerHTML = `
    <div class="section-title">اطلاعات بدنی</div>
    <div class="grid-2">
      <div class="field"><label>وزن (کیلوگرم)</label><input type="number" id="body-weight" value="${w}" /></div>
      <div class="field"><label>قد (سانتی‌متر)</label><input type="number" id="body-height" value="${h}" /></div>
    </div>
    <p style="font-size:12.5px;color:var(--text-muted)">شاخص توده بدنی (BMI) فعلی: <span class="mono tabular">${toFa(bmi)}</span> — صرفاً اطلاعاتی است.</p>
  `;
  wrap.appendChild(bodyCard);
  bodyCard.querySelector('#body-weight').addEventListener('change', (e) => { localStorage.setItem(KEYS.weight, e.target.value); renderView(); });
  bodyCard.querySelector('#body-height').addEventListener('change', (e) => { localStorage.setItem(KEYS.height, e.target.value); renderView(); });

  const installCard = el('div', 'card');
  installCard.innerHTML = `
    <details class="install-guide">
      <summary>راهنمای نصب روی گوشی اندروید ⤵</summary>
      <ol>
        <li>این صفحه را روی یک هاست HTTPS قرار بده (مثل GitHub Pages یا Netlify) یا با یک سرور محلی باز کن — فایل باز شده مستقیم (file://) قابل نصب نیست.</li>
        <li>در گوشی اندروید، آدرس را با مرورگر Chrome باز کن.</li>
        <li>روی منوی سه‌نقطه بالای Chrome بزن و «Add to Home screen» یا «Install app» را انتخاب کن.</li>
        <li>آیکون FitCore روی صفحه اصلی گوشی اضافه می‌شود و مثل یک اپ مستقل باز می‌شود.</li>
      </ol>
    </details>
  `;
  wrap.appendChild(installCard);

  const resetCard = el('div', 'card stack');
  resetCard.innerHTML = `<div class="section-title">بازنشانی</div><p style="font-size:12.5px;color:var(--text-muted)">تمام سوابق تمرین، رکورد پیاپی و روند وزن پاک می‌شود.</p>`;
  const resetBtn = el('button', 'btn btn-secondary btn-block');
  resetBtn.textContent = 'پاک‌کردن اطلاعات پیشرفت';
  resetBtn.addEventListener('click', () => {
    if (confirm('مطمئنی؟ این کار قابل بازگشت نیست.')) {
      [KEYS.completed, KEYS.checked, KEYS.weightLog].forEach((k) => localStorage.removeItem(k));
      toast('پاک شد'); renderView();
    }
  });
  resetCard.appendChild(resetBtn);
  wrap.appendChild(resetCard);

  const credit = el('div');
  credit.style.cssText = 'text-align:center;color:var(--text-muted);font-size:11.5px;padding:6px 0';
  credit.textContent = `FitCore Home · ۳ روز در هفته، هر جلسه حداکثر ۴۵ دقیقه · نسخه ${APP_VERSION}`;
  wrap.appendChild(credit);

  return wrap;
}

/* ---------- theme ---------- */
function applyTheme() {
  const t = localStorage.getItem(KEYS.theme) || 'system';
  const root = document.documentElement;
  if (t === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', t);
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    const isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    themeBtn.innerHTML = isDark ? ICONS.sun : ICONS.moon;
  }
}
function quickToggleTheme() {
  const current = localStorage.getItem(KEYS.theme) || 'system';
  const isDark = current === 'dark' || (current === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  localStorage.setItem(KEYS.theme, isDark ? 'light' : 'dark');
  applyTheme();
}

/* ---------- routing / init ---------- */
const VIEWS = { today: renderToday, week: renderWeek, library: renderLibrary, progress: renderProgress, settings: renderSettings };
function renderView() {
  clearActiveBar();
  const root = document.getElementById('view-root');
  root.innerHTML = '';
  root.appendChild(VIEWS[state.view]());
  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === state.view));
}
function switchView(v) { state.view = v; renderView(); window.scrollTo(0, 0); }

function markSetChecked(setKey, checked) {
  const map = getCheckedMap();
  map[setKey] = checked;
  writeJSON(KEYS.checked, map);
  const checkBtn = document.querySelector(`.set-check[data-setkey="${CSS.escape(setKey)}"]`);
  if (checkBtn) {
    checkBtn.classList.toggle('checked', checked);
    const row = checkBtn.closest('.set-row');
    if (row) row.classList.toggle('checked', checked);
  }
}

document.addEventListener('click', (e) => {
  primeAudioCtx();

  const setBtn = e.target.closest('[data-action="toggle-set"]');
  if (setBtn) {
    const key = setBtn.dataset.setkey;
    const nowChecked = !getCheckedMap()[key];
    markSetChecked(key, nowChecked);
    if (nowChecked) {
      const restSec = parseInt(setBtn.dataset.rest, 10) || 0;
      if (restSec > 0) showRestBar(restSec, `استراحت · ${setBtn.dataset.label}`);
    }
  }

  const workBtn = e.target.closest('[data-action="start-work-timer"]');
  if (workBtn) {
    const setKey = workBtn.dataset.setkey;
    const duration = parseInt(workBtn.dataset.duration, 10);
    const restSec = parseInt(workBtn.dataset.rest, 10) || 0;
    const label = workBtn.dataset.label;
    showActiveBar(duration, label, 'work', () => {
      markSetChecked(setKey, true);
      if (restSec > 0) showActiveBar(restSec, `استراحت · ${label}`, 'rest', null);
    });
  }

  const toggleCues = e.target.closest('[data-action="toggle-cues"]');
  if (toggleCues) {
    const cues = document.querySelector(`[data-cues="${toggleCues.dataset.exkey}"]`);
    if (cues) { cues.classList.toggle('open'); toggleCues.style.transform = cues.classList.contains('open') ? 'rotate(180deg)' : ''; }
  }
});

function buildShell() {
  document.getElementById('today-date').textContent = `${weekdayName(new Date())} ${formatShamsi(new Date())}`;
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });
  document.getElementById('theme-toggle').addEventListener('click', quickToggleTheme);
}

window.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  buildShell();
  renderView();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then((reg) => {
      reg.update().catch(() => {}); // force an immediate check instead of waiting on the browser's own schedule
    }).catch(() => {});
  }
});
