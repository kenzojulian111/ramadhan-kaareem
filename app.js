const PALETTES = [
  {
    id: "sahur",
    label: "Sahur",
    start: "03:00",
    end: "05:00",
    colors: ["#1b1f52", "#1f6e7f", "#3048a0", "#0f1b3a"],
    accent: "#cde8ff",
  },
  {
    id: "dhuha",
    label: "Dhuha",
    start: "05:00",
    end: "15:00",
    colors: ["#9fc8f5", "#f4f1e8", "#c7e8ff", "#dbe8f8"],
    accent: "#fef7de",
  },
  {
    id: "ashar",
    label: "Ashar",
    start: "15:00",
    end: "17:30",
    colors: ["#f2b793", "#efc66d", "#f4d8af", "#cf8b65"],
    accent: "#ffe8bf",
  },
  {
    id: "maghrib",
    label: "Maghrib",
    start: "17:30",
    end: "20:00",
    colors: ["#4f2b75", "#de6a2f", "#a53e88", "#5d1e50"],
    accent: "#ffc78f",
  },
  {
    id: "night",
    label: "Taraweeh",
    start: "20:00",
    end: "03:00",
    colors: ["#0d1d3d", "#040608", "#1c2b47", "#050914"],
    accent: "#d8dff1",
  },
];

const PRAYER_KEYS = [
  { key: "Fajr", label: "Fajr" },
  { key: "Dhuhr", label: "Dhuhr" },
  { key: "Asr", label: "Asr" },
  { key: "Maghrib", label: "Maghrib" },
  { key: "Isha", label: "Isha" },
];

const FALLBACK_PRAYER_SCHEDULE = {
  Imsak: "04:35",
  Fajr: "04:45",
  Dhuhr: "12:05",
  Asr: "15:25",
  Maghrib: "18:10",
  Isha: "19:20",
};

const FASTING_STORAGE_KEY = "sakinah_horizon_fasting_v1";
const CALENDAR_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const HADITHS = [
  {
    text: "Actions are judged by intentions, and each person will be rewarded according to their intention.",
    source: "Bukhari & Muslim",
  },
  {
    text: "The most beloved deeds to Allah are those that are most consistent, even if they are small.",
    source: "Bukhari",
  },
  {
    text: "Allah is gentle and loves gentleness in all matters.",
    source: "Bukhari & Muslim",
  },
  {
    text: "None of you truly believes until he loves for his brother what he loves for himself.",
    source: "Bukhari & Muslim",
  },
  {
    text: "Whoever relieves a believer's hardship, Allah will relieve his hardship on the Day of Resurrection.",
    source: "Muslim",
  },
  {
    text: "The best among you are those who learn the Quran and teach it.",
    source: "Bukhari",
  },
  {
    text: "Make things easy and do not make them difficult, give glad tidings and do not drive people away.",
    source: "Bukhari & Muslim",
  },
];

const AUDIO_PROFILES = {
  day: {
    id: "day",
    label: "Day Breeze",
    bedSrc: "./assets/audio/nature-soft.wav",
    bedVolume: 0.24,
  },
  maghrib: {
    id: "maghrib",
    label: "Maghrib Mist",
    bedSrc: "./assets/audio/nature-soft.wav",
    bedVolume: 0.18,
    overlaySrc: "./assets/audio/adhan-faint.wav",
    overlayVolume: 0.22,
    overlayLoop: false,
  },
  night: {
    id: "night",
    label: "Night Crickets",
    bedSrc: "./assets/audio/night-crickets.wav",
    bedVolume: 0.21,
  },
};

const root = document.documentElement;
const locationText = document.getElementById("locationText");
const hijriText = document.getElementById("hijriText");
const nextPrayerLabel = document.getElementById("nextPrayerLabel");
const countdownEl = document.getElementById("countdown");
const countdownHint = document.getElementById("countdownHint");
const hadithText = document.getElementById("hadithText");
const hadithSource = document.getElementById("hadithSource");
const refreshHadith = document.getElementById("refreshHadith");
const ambienceToggle = document.getElementById("ambienceToggle");
const cursorGlow = document.querySelector(".cursor-glow");
const fastingDayLabel = document.getElementById("fastingDayLabel");
const fastingStatus = document.getElementById("fastingStatus");
const fastingProgressFill = document.getElementById("fastingProgressFill");
const fastingTiming = document.getElementById("fastingTiming");
const fastingStats = document.getElementById("fastingStats");
const checkFastingToday = document.getElementById("checkFastingToday");
const imsakTimeText = document.getElementById("imsakTimeText");
const iftarTimeText = document.getElementById("iftarTimeText");
const openFastingCalendar = document.getElementById("openFastingCalendar");
const fastingCalendarModal = document.getElementById("fastingCalendarModal");
const closeFastingCalendar = document.getElementById("closeFastingCalendar");
const calendarPrev = document.getElementById("calendarPrev");
const calendarNext = document.getElementById("calendarNext");
const calendarTitle = document.getElementById("calendarTitle");
const calendarGrid = document.getElementById("calendarGrid");

let currentPaletteId = "";
let prayerSchedule = null;
let countdownTimer = null;
let hijriMeta = null;
let ambientState = {
  enabled: false,
  profileId: "",
  bed: null,
  overlay: null,
};
let fastingEntries = loadFastingEntries();
let calendarViewDate = startOfMonth(new Date());
let currentHadith = -1;

function toMinutes(value) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function isInRange(nowMinutes, startMinutes, endMinutes) {
  if (startMinutes <= endMinutes) {
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  }
  return nowMinutes >= startMinutes || nowMinutes < endMinutes;
}

function getCurrentPalette() {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return (
    PALETTES.find((palette) => {
      return isInRange(nowMinutes, toMinutes(palette.start), toMinutes(palette.end));
    }) || PALETTES[0]
  );
}

function applyPalette(palette) {
  if (currentPaletteId === palette.id) {
    return;
  }
  currentPaletteId = palette.id;
  const [a, b, c, d] = palette.colors;
  root.style.setProperty("--bg-a", a);
  root.style.setProperty("--bg-b", b);
  root.style.setProperty("--bg-c", c);
  root.style.setProperty("--bg-d", d);
  root.style.setProperty("--accent", palette.accent);

  const isNight = palette.id === "night" || palette.id === "sahur";
  root.style.setProperty("--text-main", isNight ? "#f5f7ff" : "#1c2132");
  root.style.setProperty(
    "--text-sub",
    isNight ? "rgba(245, 247, 255, 0.75)" : "rgba(28, 33, 50, 0.68)"
  );
}

function setRandomMeshPosition() {
  const meshes = document.querySelectorAll(".mesh");
  meshes.forEach((mesh) => {
    const x = `${Math.round((Math.random() - 0.5) * 26)}vmax`;
    const y = `${Math.round((Math.random() - 0.5) * 22)}vmax`;
    const size = `${Math.round(30 + Math.random() * 16)}vmax`;
    mesh.style.setProperty("--x", x);
    mesh.style.setProperty("--y", y);
    mesh.style.setProperty("--size", size);
  });
}

function rotateHadith() {
  let next = Math.floor(Math.random() * HADITHS.length);
  if (next === currentHadith) {
    next = (next + 1) % HADITHS.length;
  }
  currentHadith = next;
  hadithText.textContent = `"${HADITHS[next].text}"`;
  hadithSource.textContent = HADITHS[next].source;
}

function formatCountdown(totalSeconds) {
  const clamped = Math.max(0, totalSeconds);
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = clamped % 60;
  return [hours, minutes, seconds].map((unit) => String(unit).padStart(2, "0")).join(":");
}

function twoDigit(value) {
  return String(value).padStart(2, "0");
}

function toDateKey(date) {
  return `${date.getFullYear()}-${twoDigit(date.getMonth() + 1)}-${twoDigit(date.getDate())}`;
}

function dateFromKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isSameMonth(left, right) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

function formatClockTime(date) {
  return `${twoDigit(date.getHours())}:${twoDigit(date.getMinutes())}`;
}

function shiftClockTime(hhmm, deltaMinutes) {
  const [hour, minute] = hhmm.split(":").map(Number);
  const total = ((hour * 60 + minute + deltaMinutes) % 1440 + 1440) % 1440;
  return `${twoDigit(Math.floor(total / 60))}:${twoDigit(total % 60)}`;
}

function safeParseObject(rawValue) {
  try {
    const parsed = JSON.parse(rawValue);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
    return {};
  } catch (_) {
    return {};
  }
}

function loadFastingEntries() {
  try {
    const raw = localStorage.getItem(FASTING_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    return safeParseObject(raw);
  } catch (_) {
    return {};
  }
}

function saveFastingEntries() {
  try {
    localStorage.setItem(FASTING_STORAGE_KEY, JSON.stringify(fastingEntries));
  } catch (_) {
    // Ignore storage failures (private mode / storage blocked)
  }
}

function isChecked(dateKey) {
  return fastingEntries[dateKey] === true;
}

function countCheckedInRecentDays(now = new Date(), days = 30) {
  let count = 0;
  for (let i = 0; i < days; i += 1) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    if (isChecked(toDateKey(day))) {
      count += 1;
    }
  }
  return count;
}

function calculateStreak(now = new Date()) {
  const todayKey = toDateKey(now);
  const start = new Date(now);
  if (!isChecked(todayKey)) {
    start.setDate(start.getDate() - 1);
  }

  let streak = 0;
  for (let i = 0; i < 365; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() - i);
    if (isChecked(toDateKey(day))) {
      streak += 1;
      continue;
    }
    break;
  }
  return streak;
}

function parsePrayerDate(baseDate, hhmm) {
  const [hour, minute] = hhmm.split(":").map(Number);
  const dt = new Date(baseDate);
  dt.setHours(hour, minute, 0, 0);
  return dt;
}

function getActivePrayerSchedule() {
  return prayerSchedule || FALLBACK_PRAYER_SCHEDULE;
}

function findNextPrayer(now) {
  const schedule = getActivePrayerSchedule();
  const entries = PRAYER_KEYS.map((prayer) => {
    return {
      ...prayer,
      time: parsePrayerDate(now, schedule[prayer.key]),
    };
  });
  let next = entries.find((entry) => entry.time > now);
  if (!next) {
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    next = {
      key: "Fajr",
      label: "Fajr",
      time: parsePrayerDate(tomorrow, schedule.Fajr),
    };
  }
  return next;
}

function getFastingWindow(now) {
  const schedule = getActivePrayerSchedule();
  const start = parsePrayerDate(now, schedule.Fajr);
  const end = parsePrayerDate(now, schedule.Maghrib);
  return { start, end };
}

function buildFastingDayLabel() {
  if (!hijriMeta) {
    return "Hijri tracker mode";
  }
  const monthNumber = Number(hijriMeta?.month?.number);
  if (monthNumber === 9) {
    return `Ramadan Day ${hijriMeta.day}`;
  }
  return `${hijriMeta.month.en} ${hijriMeta.day}`;
}

function getFastingSnapshot(now) {
  const schedule = getActivePrayerSchedule();
  const { start, end } = getFastingWindow(now);
  const imsak = parsePrayerDate(now, schedule.Imsak);
  const totalSeconds = Math.max(1, Math.floor((end.getTime() - start.getTime()) / 1000));
  const untilStart = Math.floor((start.getTime() - now.getTime()) / 1000);
  const untilEnd = Math.floor((end.getTime() - now.getTime()) / 1000);

  if (now < imsak) {
    return {
      phase: "upcoming",
      statusText: "Belum mulai puasa",
      progress: 0,
      timingText: `Imsak ${formatClockTime(imsak)} | Fajr ${formatClockTime(start)} (${formatCountdown(untilStart)})`,
    };
  }

  if (now >= imsak && now < start) {
    return {
      phase: "upcoming",
      statusText: "Waktu imsak",
      progress: 0,
      timingText: `Mulai puasa saat Fajr ${formatClockTime(start)} (${formatCountdown(untilStart)})`,
    };
  }

  if (now >= start && now < end) {
    const elapsed = totalSeconds - Math.max(0, untilEnd);
    const progress = Math.min(100, Math.max(0, (elapsed / totalSeconds) * 100));
    return {
      phase: "active",
      statusText: "Sedang berpuasa",
      progress,
      timingText: `Sisa ke Maghrib ${formatCountdown(untilEnd)}`,
    };
  }

  return {
    phase: "complete",
    statusText: "Waktu berbuka",
    progress: 100,
    timingText: `Berbuka sejak ${formatClockTime(end)}`,
  };
}

function updateFastingTracker(now = new Date()) {
  if (!fastingDayLabel || !fastingStatus || !fastingProgressFill || !fastingTiming || !fastingStats || !checkFastingToday || !imsakTimeText || !iftarTimeText) {
    return;
  }

  const schedule = getActivePrayerSchedule();
  const todayKey = toDateKey(now);
  const snapshot = getFastingSnapshot(now);
  const checkedToday = isChecked(todayKey);
  const checkedCount = countCheckedInRecentDays(now, 30);
  const streak = calculateStreak(now);

  fastingDayLabel.textContent = buildFastingDayLabel();
  imsakTimeText.textContent = schedule.Imsak;
  iftarTimeText.textContent = schedule.Maghrib;
  fastingStatus.textContent = checkedToday
    ? `${snapshot.statusText} | Checked`
    : snapshot.statusText;
  fastingStatus.dataset.phase = snapshot.phase;
  fastingProgressFill.style.width = `${snapshot.progress.toFixed(1)}%`;
  fastingTiming.textContent = snapshot.timingText;
  fastingStats.textContent = `Checked 30d: ${checkedCount} | Streak: ${streak}`;
  checkFastingToday.textContent = checkedToday ? "Undo Today" : "Check Today";
  checkFastingToday.setAttribute("aria-pressed", checkedToday ? "true" : "false");
}

function toggleTodayFastingCheck() {
  toggleFastingDateKey(toDateKey(new Date()));
}

function toggleFastingDateKey(dateKey) {
  if (isChecked(dateKey)) {
    delete fastingEntries[dateKey];
  } else {
    fastingEntries[dateKey] = true;
  }
  saveFastingEntries();
  updateFastingTracker();
  renderFastingCalendar();
}

function renderFastingCalendar() {
  if (!calendarGrid || !calendarTitle) {
    return;
  }

  const currentMonthStart = startOfMonth(calendarViewDate);
  const monthLabel = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(currentMonthStart);
  calendarTitle.textContent = monthLabel;

  const firstOfMonth = new Date(currentMonthStart);
  const firstWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth() + 1, 0).getDate();
  const prevMonthDays = new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth(), 0).getDate();
  const todayKey = toDateKey(new Date());

  const fragment = document.createDocumentFragment();

  for (let index = 0; index < 42; index += 1) {
    let day;
    let cellDate;
    let isOutside = false;

    if (index < firstWeekday) {
      day = prevMonthDays - firstWeekday + index + 1;
      cellDate = new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth() - 1, day);
      isOutside = true;
    } else if (index < firstWeekday + daysInMonth) {
      day = index - firstWeekday + 1;
      cellDate = new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth(), day);
    } else {
      day = index - (firstWeekday + daysInMonth) + 1;
      cellDate = new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth() + 1, day);
      isOutside = true;
    }

    const dateKey = toDateKey(cellDate);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "calendar-day";
    button.dataset.dateKey = dateKey;
    button.setAttribute("aria-pressed", isChecked(dateKey) ? "true" : "false");
    button.setAttribute("aria-label", `${CALENDAR_WEEKDAYS[cellDate.getDay()]}, ${dateKey}`);
    button.innerHTML = `<span class="calendar-day-num">${day}</span><span class="calendar-day-dot"></span>`;

    if (isOutside) {
      button.classList.add("is-outside");
    }
    if (isChecked(dateKey)) {
      button.classList.add("is-checked");
    }
    if (dateKey === todayKey) {
      button.classList.add("is-today");
    }

    fragment.appendChild(button);
  }

  calendarGrid.innerHTML = "";
  calendarGrid.appendChild(fragment);
}

function openCalendarModal() {
  if (!fastingCalendarModal) {
    return;
  }
  renderFastingCalendar();
  fastingCalendarModal.classList.add("is-open");
  fastingCalendarModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("calendar-open");
}

function closeCalendarModal() {
  if (!fastingCalendarModal) {
    return;
  }
  fastingCalendarModal.classList.remove("is-open");
  fastingCalendarModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("calendar-open");
}

function shiftCalendarMonth(delta) {
  calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + delta, 1);
  renderFastingCalendar();
}

function setupCalendarInteractions() {
  if (!fastingCalendarModal || !calendarGrid) {
    return;
  }

  openFastingCalendar?.addEventListener("click", openCalendarModal);
  closeFastingCalendar?.addEventListener("click", closeCalendarModal);
  calendarPrev?.addEventListener("click", () => shiftCalendarMonth(-1));
  calendarNext?.addEventListener("click", () => shiftCalendarMonth(1));

  calendarGrid.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const dayBtn = target.closest(".calendar-day");
    if (!dayBtn) {
      return;
    }
    const dateKey = dayBtn.dataset.dateKey;
    if (!dateKey) {
      return;
    }
    toggleFastingDateKey(dateKey);
  });

  fastingCalendarModal.addEventListener("click", (event) => {
    if (event.target === fastingCalendarModal) {
      closeCalendarModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && fastingCalendarModal.classList.contains("is-open")) {
      closeCalendarModal();
    }
  });
}

function updateCountdown() {
  const now = new Date();
  const next = findNextPrayer(now);
  if (!next) {
    nextPrayerLabel.textContent = "Prayer schedule unavailable";
    countdownEl.textContent = "--:--:--";
    countdownHint.textContent = "Waiting for schedule data";
    updateFastingTracker(now);
    return;
  }
  const seconds = Math.floor((next.time.getTime() - now.getTime()) / 1000);
  nextPrayerLabel.textContent = `Next Prayer: ${next.label}`;
  countdownEl.textContent = formatCountdown(seconds);
  countdownHint.textContent = `Menuju ${next.label}`;
  updateFastingTracker(now);
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

function formatHijri(hijri) {
  if (!hijri) {
    return "Hijri date unavailable";
  }
  return `${hijri.day} ${hijri.month.en} ${hijri.year} AH`;
}

function cleanTime(rawTime) {
  return rawTime.split(" ")[0];
}

function resolveImsakTime(timings) {
  const rawImsak = timings?.Imsak ? cleanTime(timings.Imsak) : "";
  if (rawImsak) {
    return rawImsak;
  }
  const fajrTime = cleanTime(timings.Fajr);
  return shiftClockTime(fajrTime, -10);
}

async function loadPrayerData(lat, lon) {
  const timestamp = Math.floor(Date.now() / 1000);
  const apiUrl = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${lat}&longitude=${lon}&method=2`;
  const payload = await fetchJson(apiUrl);
  const timings = payload?.data?.timings;

  if (!timings) {
    throw new Error("No timings in prayer API response");
  }

  prayerSchedule = {
    Imsak: resolveImsakTime(timings),
    Fajr: cleanTime(timings.Fajr),
    Dhuhr: cleanTime(timings.Dhuhr),
    Asr: cleanTime(timings.Asr),
    Maghrib: cleanTime(timings.Maghrib),
    Isha: cleanTime(timings.Isha),
  };

  hijriMeta = payload?.data?.date?.hijri || null;
  hijriText.textContent = formatHijri(hijriMeta);
  updateCountdown();
}

async function reverseGeocode(lat, lon) {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
  const geo = await fetchJson(url);
  const city = geo.city || geo.locality || geo.principalSubdivision || "Unknown Area";
  const country = geo.countryName || "";
  locationText.textContent = `${city}${country ? `, ${country}` : ""}`;
}

async function initLocationAndPrayer() {
  if (!("geolocation" in navigator)) {
    locationText.textContent = "Location unavailable";
    hijriText.textContent = "Hijri date unavailable";
    prayerSchedule = { ...FALLBACK_PRAYER_SCHEDULE };
    hijriMeta = null;
    updateCountdown();
    return;
  }

  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 9000,
        maximumAge: 300000,
      });
    });
    const { latitude, longitude } = position.coords;
    await Promise.all([reverseGeocode(latitude, longitude), loadPrayerData(latitude, longitude)]);
  } catch (error) {
    locationText.textContent = "Location permission needed";
    hijriText.textContent = "Using local fallback";
    prayerSchedule = { ...FALLBACK_PRAYER_SCHEDULE };
    hijriMeta = null;
    updateCountdown();
  }
}

function initCountdownTick() {
  updateCountdown();
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
  countdownTimer = setInterval(updateCountdown, 1000);
}

function updatePaletteCycle() {
  applyPalette(getCurrentPalette());
  syncAmbienceWithPalette();
}

function initPaletteEngine() {
  updatePaletteCycle();
  setRandomMeshPosition();
  setInterval(() => {
    updatePaletteCycle();
    setRandomMeshPosition();
  }, 22000);
}

function setupCursorGlow() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    return;
  }
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let tx = x;
  let ty = y;

  window.addEventListener("mousemove", (event) => {
    tx = event.clientX;
    ty = event.clientY;
  });

  const tick = () => {
    x += (tx - x) * 0.14;
    y += (ty - y) * 0.14;
    cursorGlow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    requestAnimationFrame(tick);
  };
  tick();
}

function clampVolume(value) {
  return Math.min(1, Math.max(0, value));
}

function fadeVolume(audio, target, duration = 700) {
  const safeTarget = clampVolume(target);
  if (!audio || duration <= 0) {
    if (audio) {
      audio.volume = safeTarget;
    }
    return Promise.resolve();
  }

  const initial = audio.volume;
  const delta = safeTarget - initial;
  if (Math.abs(delta) < 0.001) {
    audio.volume = safeTarget;
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      audio.volume = clampVolume(initial + delta * progress);
      if (progress < 1) {
        requestAnimationFrame(step);
        return;
      }
      resolve();
    };
    requestAnimationFrame(step);
  });
}

function buildAudio(src, loop) {
  const audio = new Audio(src);
  audio.preload = "auto";
  audio.loop = loop;
  audio.volume = 0;
  return audio;
}

async function stopAudioTrack(audio, fadeMs = 420) {
  if (!audio) {
    return;
  }
  try {
    await fadeVolume(audio, 0, fadeMs);
  } catch (_) {
    // Ignore fade race during fast toggles
  }
  audio.pause();
  audio.currentTime = 0;
}

function getAmbienceProfile(paletteId = currentPaletteId) {
  if (paletteId === "maghrib") {
    return AUDIO_PROFILES.maghrib;
  }
  if (paletteId === "night" || paletteId === "sahur") {
    return AUDIO_PROFILES.night;
  }
  return AUDIO_PROFILES.day;
}

function setAmbienceUi(active, label = "") {
  ambienceToggle.dataset.active = active ? "true" : "false";
  ambienceToggle.setAttribute("aria-pressed", active ? "true" : "false");
  ambienceToggle.textContent = active ? `Sound Ambience: On (${label})` : "Sound Ambience: Off";
}

async function stopAmbience(keepEnabled = false) {
  const bed = ambientState.bed;
  const overlay = ambientState.overlay;
  ambientState.bed = null;
  ambientState.overlay = null;
  ambientState.profileId = "";

  await Promise.all([stopAudioTrack(bed), stopAudioTrack(overlay)]);
  ambientState.enabled = keepEnabled;
}

async function playAmbienceProfile(profile) {
  await stopAmbience(true);

  const bed = buildAudio(profile.bedSrc, true);
  await bed.play();
  ambientState.bed = bed;
  fadeVolume(bed, profile.bedVolume, 1000).catch(() => null);

  if (profile.overlaySrc) {
    const overlay = buildAudio(profile.overlaySrc, profile.overlayLoop === true);
    await overlay.play();
    ambientState.overlay = overlay;
    fadeVolume(overlay, profile.overlayVolume ?? 0.2, 1200).catch(() => null);
  }

  ambientState.profileId = profile.id;
  setAmbienceUi(true, profile.label);
}

function syncAmbienceWithPalette() {
  if (!ambientState.enabled) {
    return;
  }
  const profile = getAmbienceProfile();
  if (profile.id === ambientState.profileId) {
    return;
  }
  playAmbienceProfile(profile).catch(() => {
    stopAmbience(false).catch(() => null);
    setAmbienceUi(false);
    ambienceToggle.textContent = "Sound unavailable";
  });
}

function preloadAmbienceFiles() {
  const seen = new Set();
  Object.values(AUDIO_PROFILES).forEach((profile) => {
    [profile.bedSrc, profile.overlaySrc].forEach((src) => {
      if (!src || seen.has(src)) {
        return;
      }
      seen.add(src);
      const preloader = new Audio(src);
      preloader.preload = "auto";
      preloader.load();
    });
  });
}

async function toggleAmbience() {
  if (!ambientState.enabled) {
    ambientState.enabled = true;
    const profile = getAmbienceProfile();
    await playAmbienceProfile(profile);
    return;
  }
  await stopAmbience(false);
  setAmbienceUi(false);
}

function bootstrap() {
  setTimeout(() => {
    document.body.classList.remove("is-loading");
    document.body.classList.add("is-ready");
  }, 120);

  rotateHadith();
  initPaletteEngine();
  initCountdownTick();
  initLocationAndPrayer();
  setupCursorGlow();
  preloadAmbienceFiles();
  updateFastingTracker();
  setupCalendarInteractions();
  renderFastingCalendar();

  refreshHadith.addEventListener("click", rotateHadith);
  if (checkFastingToday) {
    checkFastingToday.addEventListener("click", toggleTodayFastingCheck);
  }
  ambienceToggle.addEventListener("click", () => {
    toggleAmbience().catch(() => {
      stopAmbience(false).catch(() => null);
      setAmbienceUi(false);
      ambienceToggle.textContent = "Sound blocked by browser";
    });
  });

  setTimeout(() => {
    openCalendarModal();
  }, 650);
}

window.addEventListener("DOMContentLoaded", bootstrap);

