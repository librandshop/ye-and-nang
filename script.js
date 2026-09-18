const invitationIntro = document.querySelector(".invitation-intro");
const openInvitation = document.querySelector(".envelope");
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const motionButton = document.querySelector(".motion-toggle");
const soundButton = document.querySelector(".sound-toggle");
const storySoundButton = document.querySelector(".story-opening__sound");
const pageContent = [...document.querySelectorAll(".site-header, main, footer")];
let motionPaused = motionPreference.matches;
let openingTimer;
let revealObserver;
let lastRsvpName = "";
const openingSkip = document.querySelector(".opening-skip");
const openingDuration = 6600;
let soundEnabled = false;
let soundChoiceMade = false;
let musicFadeTimer;
const openingAudioTimers = new Set();
const musicTracks = {
  en: { src:"https://assets.mixkit.co/music/672/672.mp3", title:"Wedding Harp", artist:"Francisco Alvear" },
  th: { src:"https://assets.mixkit.co/music/599/599.mp3", title:"Possible Dreams", artist:"Eugenio Mininni" },
  my: { src:"https://assets.mixkit.co/music/272/272.mp3", title:"Wedding Music", artist:"Arulo" },
};
const musicPlayer = new Audio();
musicPlayer.loop = true;
musicPlayer.preload = "metadata";
musicPlayer.playsInline = true;
const openingSounds = {
  seal: "https://assets.mixkit.co/active_storage/sfx/1530/1530-preview.mp3",
  lift: "https://assets.mixkit.co/active_storage/sfx/1103/1103-preview.mp3",
  rustle: "https://assets.mixkit.co/active_storage/sfx/2379/2379-preview.mp3",
  unfold: "https://assets.mixkit.co/active_storage/sfx/1105/1105-preview.mp3",
};
Object.entries(openingSounds).forEach(([name, src]) => {
  const audio = new Audio();
  audio.preload = "none";
  audio.playsInline = true;
  audio.src = src;
  openingSounds[name] = audio;
});

function playRecordedSound(audio, volume, startAt = 0) {
  if (!soundEnabled) return;
  try {
    audio.pause();
    audio.currentTime = startAt;
    audio.volume = volume;
    audio.play().catch(() => {});
  } catch { /* Audio remains optional when a browser blocks playback. */ }
}

function scheduleOpeningSound(name, delay, volume, startAt = 0) {
  const timer = window.setTimeout(() => {
    openingAudioTimers.delete(timer);
    playRecordedSound(openingSounds[name], volume, startAt);
  }, delay);
  openingAudioTimers.add(timer);
}

function stopOpeningAudio() {
  openingAudioTimers.forEach(timer => window.clearTimeout(timer));
  openingAudioTimers.clear();
  Object.values(openingSounds).forEach(audio => {
    audio.pause();
    try { audio.currentTime = 0; } catch { /* Metadata may still be loading. */ }
  });
}

function playOpeningSoundscape() {
  if (!soundEnabled) return;
  stopOpeningAudio();
  playRecordedSound(openingSounds.seal, .48);
  scheduleOpeningSound("lift", 650, .28, .18);
  scheduleOpeningSound("rustle", 2050, .24, .35);
  scheduleOpeningSound("unfold", 3580, .42);
  scheduleOpeningSound("unfold", 4480, .32);
}

function stopMusic(reset = true) {
  window.clearInterval(musicFadeTimer);
  musicFadeTimer = undefined;
  musicPlayer.pause();
  if (reset) {
    try { musicPlayer.currentTime = 0; } catch { /* Metadata may still be loading. */ }
  }
  document.body.classList.remove("music-playing");
}

function startMusic(language = document.documentElement.lang) {
  if (!soundEnabled || document.hidden || !invitationIntro.hidden) return;
  language = musicTracks[language] ? language : "en";
  const track = musicTracks[language];
  const changingTrack = musicPlayer.dataset.language !== language;
  if (changingTrack) {
    stopMusic();
    musicPlayer.src = track.src;
    musicPlayer.dataset.language = language;
    musicPlayer.load();
  }
  musicPlayer.volume = 0;
  document.body.dataset.score = language;
  document.body.dataset.track = track.title;
  musicPlayer.play().then(() => {
    document.body.classList.add("music-playing");
    window.clearInterval(musicFadeTimer);
    musicFadeTimer = window.setInterval(() => {
      musicPlayer.volume = Math.min(.24, musicPlayer.volume + .018);
      if (musicPlayer.volume >= .24) {
        window.clearInterval(musicFadeTimer);
        musicFadeTimer = undefined;
      }
    }, 110);
  }).catch(() => document.body.classList.remove("music-playing"));
}

function refreshSoundButton() {
  const copy = translations[document.documentElement.lang] || translations.en;
  soundButton.querySelector(".sound-toggle__label").textContent = soundEnabled ? copy.muteSound : copy.playSound;
  soundButton.querySelector(".sound-toggle__icon").textContent = soundEnabled ? "♫" : "♪";
  soundButton.setAttribute("aria-pressed", String(soundEnabled));
  soundButton.classList.toggle("is-active", soundEnabled);
  if (storySoundButton) {
    storySoundButton.querySelector("span:last-child").textContent = soundEnabled ? copy.muteSound : copy.playSound;
    storySoundButton.querySelector("span:first-child").textContent = soundEnabled ? "♫" : "♪";
    storySoundButton.setAttribute("aria-pressed", String(soundEnabled));
    storySoundButton.classList.toggle("is-active", soundEnabled);
  }
}

function setSoundEnabled(enabled, userChoice = true) {
  if (userChoice) soundChoiceMade = true;
  soundEnabled = Boolean(enabled);
  document.body.classList.toggle("sound-enabled", soundEnabled);
  if (soundEnabled) {
    if (invitationIntro.hidden) startMusic();
  } else {
    stopOpeningAudio();
    stopMusic();
  }
  refreshSoundButton();
}

function positionFoldedCard() {
  // One physical card lives between the envelope back and its front pocket.
  // Use untransformed dimensions so replay and viewport changes remain exact.
  const envelopeBounds = openInvitation.getBoundingClientRect();
  const card = document.querySelector('.keepsake');
  const foldedScale = Math.min(envelopeBounds.width * .86 / card.offsetHeight, envelopeBounds.height * .84 / card.offsetWidth);
  invitationIntro.style.setProperty('--card-start-scale', foldedScale);
  invitationIntro.style.setProperty('--card-end-x', `${innerWidth / 2 - envelopeBounds.left - envelopeBounds.width / 2}px`);
  invitationIntro.style.setProperty('--card-end-y', `${innerHeight / 2 - envelopeBounds.top - envelopeBounds.height / 2}px`);
  invitationIntro.style.setProperty('--card-lift-y', `${-envelopeBounds.height * .9}px`);
}

function finishOpening() {
  window.clearTimeout(openingTimer);
  invitationIntro.hidden = true;
  openingSkip.hidden = true;
  openInvitation.removeAttribute("aria-disabled");
  document.body.classList.remove("invitation-open", "invitation-opening");
  pageContent.forEach(element => { element.inert = false; });
  document.body.classList.add("invitation-ready");
  stopOpeningAudio();
  if (soundEnabled) window.setTimeout(() => startMusic(), 180);
  document.querySelector("#couple-names").focus({ preventScroll: true });
  observeReveals();
}

function revealInvitation() {
  if (invitationIntro.hidden || document.body.classList.contains("invitation-opening")) return;
  if (!soundChoiceMade) setSoundEnabled(true, false);
  playOpeningSoundscape();
  if (motionPaused) { finishOpening(); return; }
  positionFoldedCard();
  openInvitation.setAttribute("aria-disabled", "true");
  openingSkip.hidden = false;
  openingSkip.focus({ preventScroll: true });
  document.body.classList.add("invitation-opening");
  openingTimer = window.setTimeout(finishOpening, openingDuration);
}

function showEnvelope() {
  window.clearTimeout(openingTimer);
  revealObserver?.disconnect();
  stopOpeningAudio();
  stopMusic();
  document.body.classList.remove("invitation-ready", "invitation-opening");
  document.body.classList.remove("controls-compact");
  openingSkip.hidden = true;
  openInvitation.removeAttribute("aria-disabled");
  window.scrollTo({ top: 0, behavior: "instant" });
  invitationIntro.hidden = false;
  positionFoldedCard();
  document.body.classList.add("invitation-open");
  pageContent.forEach(element => { element.inert = true; });
  document.querySelectorAll("[data-reveal]").forEach(element => element.classList.remove("is-visible"));
  document.querySelectorAll(".has-visible-reveal").forEach(element => element.classList.remove("has-visible-reveal"));
  openInvitation.focus({ preventScroll: true });
}

function observeReveals() {
  const elements = document.querySelectorAll("[data-reveal]");
  const reveal = element => {
    element.classList.add("is-visible");
    element.closest(".section, .savebar")?.classList.add("has-visible-reveal");
  };
  if (motionPaused || !("IntersectionObserver" in window)) {
    elements.forEach(reveal);
    return;
  }
  revealObserver ??= new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      reveal(entry.target);
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: .12, rootMargin: "0px 0px -25px 0px" });
  elements.forEach(element => revealObserver.observe(element));
}

function initializeMotionZones() {
  const zones = document.querySelectorAll(".wedding-letter > .story-opening, .wedding-letter > .hero, .wedding-letter > .section, .wedding-letter > .savebar, footer");
  zones.forEach(zone => zone.classList.add("motion-zone"));
  if (!("IntersectionObserver" in window)) {
    zones.forEach(zone => zone.classList.add("is-motion-active"));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.target.classList.toggle("is-motion-active", entry.isIntersecting));
  }, { rootMargin: "80% 0px 80% 0px" });
  zones.forEach(zone => observer.observe(zone));
  const storyOpening = document.querySelector(".story-opening");
  if (storyOpening) {
    const storyObserver = new IntersectionObserver(entries => {
      document.body.classList.toggle("story-opening-active", entries[0]?.isIntersecting && entries[0].intersectionRatio > .35);
    }, { threshold: [.35] });
    storyObserver.observe(storyOpening);
  }
}

function refreshMotionButton() {
  const copy = translations[document.documentElement.lang] || translations.en;
  motionButton.querySelector(".motion-toggle__label").textContent = motionPaused ? copy.resumeMotion : copy.pauseMotion;
  motionButton.querySelector(".motion-toggle__icon").textContent = motionPaused ? "▷" : "Ⅱ";
  motionButton.setAttribute("aria-pressed", String(motionPaused));
}

function setMotionPaused(paused) {
  motionPaused = paused;
  document.body.classList.toggle("motion-paused", paused);
  document.body.classList.toggle("motion-enabled", !paused);
  refreshMotionButton();
  if (paused && document.body.classList.contains("invitation-opening")) finishOpening();
  if (invitationIntro.hidden) observeReveals();
}

function initializeInvitation() {
  document.body.classList.add("js-motion");
  document.querySelectorAll(".keepsake__words > *").forEach((element, index) => element.style.setProperty("--ink-order", index));
  const openingPetals = document.querySelectorAll(".opening-petals i");
  openingPetals.forEach((petal, index) => {
    const angle = index * Math.PI * 2 / openingPetals.length;
    const heartX = 16 * Math.sin(angle) ** 3;
    const heartY = 13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle);
    petal.style.setProperty("--petal-order", index);
    petal.style.setProperty("--petal-x", `${heartX * Math.min(innerWidth * .0175, 7.8)}px`);
    petal.style.setProperty("--petal-y", `${-heartY * Math.min(innerWidth * .0125, 5.8)}px`);
    petal.style.setProperty("--petal-turn", `${120 + index * 37}deg`);
  });
  document.querySelectorAll(".opening-stars i").forEach((star, index) => star.style.setProperty("--star-order", index));
  document.querySelectorAll(".hero__copy-inner > *").forEach((element, index) => element.style.setProperty("--order", index));
  initializeMotionZones();
  const groups = [
    ".story-opening__copy > *, .story-opening__sound", ".savebar__copy, .calendar-actions", ".intro__heading, .intro__copy", ".photo-story:not([hidden]) .photo-story__heading, .photo-scene__figure",
    ".schedule > .container > .eyebrow, .schedule h2", ".schedule-card", ".love-divider, .program-note, .letter-bow--reply",
    ".portrait-chapter__figure", ".venue__visual, .venue__copy", ".countdown .eyebrow, .countdown h2", ".story-closing__image-wrap, .story-closing__copy",
    ".countdown__grid > div", ".rsvp__frame", ".rsvp__content > :not(.rsvp-thanks):not(noscript)", "footer > *"
  ];
  groups.forEach(selector => document.querySelectorAll(selector).forEach((element, index) => {
    element.dataset.reveal = element.matches(".schedule-card, .rsvp__frame") ? "card" : element.matches(".venue__visual") ? "art" : "text";
    element.style.setProperty("--delay", `${Math.min(index * 130, 390)}ms`);
  }));
  openInvitation.addEventListener("click", revealInvitation);
  openingSkip.addEventListener("click", finishOpening);
  document.querySelector(".replay-button").hidden = false;
  document.querySelector(".replay-button").addEventListener("click", showEnvelope);
  motionButton.hidden = false;
  motionButton.addEventListener("click", () => setMotionPaused(!motionPaused));
  soundButton.hidden = false;
  soundButton.addEventListener("click", () => setSoundEnabled(!soundEnabled));
  storySoundButton?.addEventListener("click", () => setSoundEnabled(!soundEnabled));
  motionPreference.addEventListener("change", event => setMotionPaused(event.matches));
  setMotionPaused(motionPaused);
  document.addEventListener("keydown", event => {
    if (invitationIntro.hidden) return;
    if (event.key === "Escape") { event.preventDefault(); finishOpening(); }
    if (event.key === "Tab") {
      const focusable = [...invitationIntro.querySelectorAll("button"), soundButton, motionButton].filter(button => !button.hidden && button.getAttribute("aria-disabled") !== "true");
      const index = focusable.indexOf(document.activeElement);
      event.preventDefault();
      focusable[(index + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length].focus();
    }
  });
  document.addEventListener("visibilitychange", () => {
    document.body.classList.toggle("page-hidden", document.hidden);
    // Avoid resuming halfway through a ceremony after switching apps.
    if (document.hidden && document.body.classList.contains("invitation-opening")) finishOpening();
    if (document.hidden) stopMusic();
    else if (soundEnabled && invitationIntro.hidden) startMusic();
  });
  const progress = document.querySelector(".reading-progress");
  const weddingLetter = document.querySelector(".wedding-letter");
  let scrollFrame = false;
  const hero = document.querySelector(".hero");
  const venueArt = document.querySelector(".venue__visual");
  let lastPaperLight = -1;
  function updateProgress() {
    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY;
    const distance = document.documentElement.scrollHeight - viewportHeight;
    const readingProgress = distance > 0 ? Math.min(1, scrollY / distance) : 0;
    const invitationVisible = invitationIntro.hidden;
    let flowerDepth;
    let paperAngle;
    let paperLift;
    if (!motionPaused && invitationVisible) {
      const heroBounds = hero.getBoundingClientRect();
      if (heroBounds.bottom > 0) flowerDepth = Math.min(scrollY * .09, 70);
      const artBounds = venueArt.getBoundingClientRect();
      if (artBounds.bottom > 0 && artBounds.top < viewportHeight) {
        const travel = Math.max(0, Math.min(1, (viewportHeight - artBounds.top) / (viewportHeight + artBounds.height)));
        paperAngle = -10 + travel * 9;
        paperLift = 16 - travel * 32;
      }
    }

    progress.style.setProperty("--reading-progress", readingProgress);
    progress.style.transform = `scaleX(${readingProgress})`;
    const paperLight = Math.round((18 + readingProgress * 64) / 2) * 2;
    if (paperLight !== lastPaperLight) {
      weddingLetter.style.setProperty("--paper-light", `${paperLight}%`);
      lastPaperLight = paperLight;
    }
    document.body.classList.toggle("controls-compact", invitationVisible && scrollY > Math.min(420, viewportHeight * .52));
    if (flowerDepth !== undefined) hero.style.setProperty("--flower-depth", `${flowerDepth}px`);
    if (paperAngle !== undefined) {
      venueArt.style.setProperty("--paper-angle", `${paperAngle}deg`);
      venueArt.style.setProperty("--paper-lift", `${paperLift}px`);
    }
    scrollFrame = false;
  }
  window.addEventListener("scroll", () => {
    if (!scrollFrame) { scrollFrame = true; requestAnimationFrame(updateProgress); }
  }, { passive: true });
  window.addEventListener("resize", updateProgress);
  window.addEventListener('resize', () => {
    if (!invitationIntro.hidden && !document.body.classList.contains('invitation-opening')) positionFoldedCard();
  });
  document.fonts.ready.then(() => {
    if (!invitationIntro.hidden && !document.body.classList.contains('invitation-opening')) positionFoldedCard();
  });
  updateProgress();
  if (window.location.hash && document.getElementById(window.location.hash.slice(1))) {
    document.body.classList.add("invitation-ready");
    observeReveals();
  } else showEnvelope();
}

// Replace midnight with the confirmed ceremony time when available.
const weddingDate = new Date("2026-11-08T00:00:00");

const units = {
  days: document.querySelector("#days"),
  hours: document.querySelector("#hours"),
  minutes: document.querySelector("#minutes"),
  seconds: document.querySelector("#seconds"),
};
let countdownVisible = false;
const countdownSection = document.querySelector(".countdown");
if ("IntersectionObserver" in window) {
  new IntersectionObserver(([entry]) => { countdownVisible = entry.isIntersecting; }, {
    rootMargin: "120px 0px",
  }).observe(countdownSection);
} else {
  countdownVisible = true;
}

const translations = {
  en: {
    pageTitle: "Ye & Nang's Wedding Invitation",
    pageDescription: "Wedding invitation for Ye Moe Myint and Nang Htet Htet Aung.",
    heroEyebrow: "Together with their families",
    heroInvite: "joyfully invite you to celebrate the wedding of",
    heroDate: "Sunday, the eighth<br>of November",
    heroYear: "Two Thousand Twenty-Six",
    savebarTitle: "Keep this date close",
    saveDate: "Add to Google Calendar",
    calendarFile: "Apple Calendar & Outlook",
    details: "Details",
    celebrateEyebrow: "A celebration of love",
    celebrateTitle: "We're getting married",
    celebrateCopy: "We would be so happy to have you by our side as we begin our next chapter. Join us for an evening of vows, dinner, dancing, and a little bit of magic.",
    scheduleEyebrow: "The day",
    scheduleDate: "Sunday, November 8, 2026",
    welcomeReception: "Welcome Reception",
    betrothalCeremony: "Betrothal Ceremony",
    payingRespectsCeremony: "Paying Respects Ceremony",
    waterPouringCeremony: "Water Pouring Ceremony",
    weddingCelebration: "Wedding Celebration",
    timeWelcome: "3:00 PM",
    timeBetrothal: "3:30 PM",
    timeRespects: "5:00 PM",
    timeWater: "5:30 PM",
    timeCelebration: "6:30 PM",
    programNote: "We look forward to celebrating<br>each moment with you",
    ceremony: "Ceremony",
    reception: "Reception",
    dinnerDancing: "Dinner & Dancing",
    timeTba: "Time to be announced",
    detailsSoon: "Wedding details<br>will be shared soon",
    venueLabel: "Wedding<br>venue",
    venueEyebrow: "Where to find us",
    venueTitle: "Our wedding venue",
    venueCopy: "Tap below to see the location and get directions<br>on Google Maps.",
    openMaps: "Open in Google Maps",
    countdownEyebrow: "Counting down",
    countdownTitle: "Until we say I do",
    days: "Days",
    hours: "Hours",
    minutes: "Minutes",
    seconds: "Seconds",
    rsvpEyebrow: "Kindly reply",
    rsvpTitle: "Will you celebrate with us?",
    rsvpCopy: "Please let us know whether you can join us by completing our RSVP form.",
    rsvpButton: "RSVP now",
    rsvpNote: "Please reply by 30 September 2026",
    footerDate: "November 8, 2026",
  },
  th: {
    pageTitle: "\u0e01\u0e32\u0e23\u0e4c\u0e14\u0e40\u0e0a\u0e34\u0e0d\u0e07\u0e32\u0e19\u0e41\u0e15\u0e48\u0e07\u0e07\u0e32\u0e19 Ye & Nang",
    pageDescription: "\u0e01\u0e32\u0e23\u0e4c\u0e14\u0e40\u0e0a\u0e34\u0e0d\u0e07\u0e32\u0e19\u0e41\u0e15\u0e48\u0e07\u0e07\u0e32\u0e19\u0e02\u0e2d\u0e07 Ye Moe Myint \u0e41\u0e25\u0e30 Nang Htet Htet Aung",
    heroEyebrow: "\u0e1e\u0e23\u0e49\u0e2d\u0e21\u0e14\u0e49\u0e27\u0e22\u0e04\u0e23\u0e2d\u0e1a\u0e04\u0e23\u0e31\u0e27\u0e02\u0e2d\u0e07\u0e17\u0e31\u0e49\u0e07\u0e2a\u0e2d\u0e07\u0e1d\u0e48\u0e32\u0e22",
    heroInvite: "\u0e21\u0e35\u0e04\u0e27\u0e32\u0e21\u0e22\u0e34\u0e19\u0e14\u0e35\u0e02\u0e2d\u0e40\u0e0a\u0e34\u0e0d\u0e23\u0e48\u0e27\u0e21\u0e40\u0e1b\u0e47\u0e19\u0e2a\u0e31\u0e01\u0e02\u0e35\u0e1e\u0e22\u0e32\u0e19\u0e43\u0e19\u0e07\u0e32\u0e19\u0e21\u0e07\u0e04\u0e25\u0e2a\u0e21\u0e23\u0e2a\u0e02\u0e2d\u0e07",
    heroDate: "\u0e27\u0e31\u0e19\u0e2d\u0e32\u0e17\u0e34\u0e15\u0e22\u0e4c\u0e17\u0e35\u0e48 8<br>\u0e1e\u0e24\u0e28\u0e08\u0e34\u0e01\u0e32\u0e22\u0e19",
    heroYear: "\u0e1e.\u0e28. 2569",
    savebarTitle: "\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01\u0e27\u0e31\u0e19\u0e2a\u0e33\u0e04\u0e31\u0e0d\u0e19\u0e35\u0e49\u0e44\u0e27\u0e49",
    saveDate: "\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e43\u0e19 Google Calendar",
    calendarFile: "Apple Calendar \u0e41\u0e25\u0e30 Outlook",
    details: "\u0e23\u0e32\u0e22\u0e25\u0e30\u0e40\u0e2d\u0e35\u0e22\u0e14",
    celebrateEyebrow: "\u0e40\u0e09\u0e25\u0e34\u0e21\u0e09\u0e25\u0e2d\u0e07\u0e04\u0e27\u0e32\u0e21\u0e23\u0e31\u0e01",
    celebrateTitle: "\u0e40\u0e23\u0e32\u0e01\u0e33\u0e25\u0e31\u0e07\u0e08\u0e30\u0e41\u0e15\u0e48\u0e07\u0e07\u0e32\u0e19",
    celebrateCopy: "\u0e40\u0e23\u0e32\u0e22\u0e34\u0e19\u0e14\u0e35\u0e40\u0e1b\u0e47\u0e19\u0e2d\u0e22\u0e48\u0e32\u0e07\u0e22\u0e34\u0e48\u0e07\u0e17\u0e35\u0e48\u0e08\u0e30\u0e44\u0e14\u0e49\u0e21\u0e35\u0e04\u0e38\u0e13\u0e23\u0e48\u0e27\u0e21\u0e41\u0e1a\u0e48\u0e07\u0e1b\u0e31\u0e19\u0e27\u0e31\u0e19\u0e1e\u0e34\u0e40\u0e28\u0e29\u0e02\u0e2d\u0e07\u0e40\u0e23\u0e32 \u0e23\u0e48\u0e27\u0e21\u0e40\u0e1b\u0e47\u0e19\u0e2a\u0e31\u0e01\u0e02\u0e35\u0e1e\u0e22\u0e32\u0e19\u0e43\u0e19\u0e1e\u0e34\u0e18\u0e35 \u0e23\u0e31\u0e1a\u0e1b\u0e23\u0e30\u0e17\u0e32\u0e19\u0e2d\u0e32\u0e2b\u0e32\u0e23 \u0e40\u0e15\u0e49\u0e19\u0e23\u0e33 \u0e41\u0e25\u0e30\u0e2a\u0e23\u0e49\u0e32\u0e07\u0e04\u0e27\u0e32\u0e21\u0e17\u0e23\u0e07\u0e08\u0e33\u0e41\u0e2a\u0e19\u0e1e\u0e34\u0e40\u0e28\u0e29\u0e44\u0e1b\u0e14\u0e49\u0e27\u0e22\u0e01\u0e31\u0e19",
    scheduleEyebrow: "\u0e01\u0e33\u0e2b\u0e19\u0e14\u0e01\u0e32\u0e23",
    scheduleDate: "\u0e27\u0e31\u0e19\u0e2d\u0e32\u0e17\u0e34\u0e15\u0e22\u0e4c\u0e17\u0e35\u0e48 8 \u0e1e\u0e24\u0e28\u0e08\u0e34\u0e01\u0e32\u0e22\u0e19 \u0e1e.\u0e28. 2569",
    welcomeReception: "งานต้อนรับ",
    betrothalCeremony: "พิธีหมั้น",
    payingRespectsCeremony: "พิธีไหว้ผู้ใหญ่",
    waterPouringCeremony: "พิธีรดน้ำสังข์",
    weddingCelebration: "งานฉลองมงคลสมรส",
    timeWelcome: "15:00 น.",
    timeBetrothal: "15:30 น.",
    timeRespects: "17:00 น.",
    timeWater: "17:30 น.",
    timeCelebration: "18:30 น.",
    programNote: "เรายินดีที่จะได้ร่วมฉลอง<br>ทุกช่วงเวลาไปกับคุณ",
    ceremony: "\u0e1e\u0e34\u0e18\u0e35\u0e21\u0e07\u0e04\u0e25\u0e2a\u0e21\u0e23\u0e2a",
    reception: "\u0e07\u0e32\u0e19\u0e40\u0e25\u0e35\u0e49\u0e22\u0e07\u0e09\u0e25\u0e2d\u0e07",
    dinnerDancing: "\u0e14\u0e34\u0e19\u0e40\u0e19\u0e2d\u0e23\u0e4c\u0e41\u0e25\u0e30\u0e01\u0e32\u0e23\u0e40\u0e15\u0e49\u0e19\u0e23\u0e33",
    timeTba: "\u0e08\u0e30\u0e41\u0e08\u0e49\u0e07\u0e43\u0e2b\u0e49\u0e17\u0e23\u0e32\u0e1a\u0e20\u0e32\u0e22\u0e2b\u0e25\u0e31\u0e07",
    detailsSoon: "\u0e23\u0e32\u0e22\u0e25\u0e30\u0e40\u0e2d\u0e35\u0e22\u0e14\u0e07\u0e32\u0e19\u0e08\u0e30\u0e1b\u0e23\u0e30\u0e01\u0e32\u0e28\u0e40\u0e23\u0e47\u0e27 \u0e46 \u0e19\u0e35\u0e49",
    venueLabel: "\u0e2a\u0e16\u0e32\u0e19\u0e17\u0e35\u0e48<br>\u0e08\u0e31\u0e14\u0e07\u0e32\u0e19",
    venueEyebrow: "\u0e2a\u0e16\u0e32\u0e19\u0e17\u0e35\u0e48\u0e08\u0e31\u0e14\u0e07\u0e32\u0e19",
    venueTitle: "\u0e2a\u0e16\u0e32\u0e19\u0e17\u0e35\u0e48\u0e08\u0e31\u0e14\u0e07\u0e32\u0e19\u0e41\u0e15\u0e48\u0e07\u0e07\u0e32\u0e19",
    venueCopy: "\u0e41\u0e15\u0e30\u0e14\u0e49\u0e32\u0e19\u0e25\u0e48\u0e32\u0e07\u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e14\u0e39\u0e2a\u0e16\u0e32\u0e19\u0e17\u0e35\u0e48\u0e41\u0e25\u0e30\u0e23\u0e31\u0e1a\u0e40\u0e2a\u0e49\u0e19\u0e17\u0e32\u0e07\u0e43\u0e19<br>Google Maps",
    openMaps: "\u0e40\u0e1b\u0e34\u0e14\u0e43\u0e19 Google Maps",
    countdownEyebrow: "\u0e19\u0e31\u0e1a\u0e16\u0e2d\u0e22\u0e2b\u0e25\u0e31\u0e07",
    countdownTitle: "\u0e08\u0e19\u0e01\u0e27\u0e48\u0e32\u0e08\u0e30\u0e16\u0e36\u0e07\u0e27\u0e31\u0e19\u0e02\u0e2d\u0e07\u0e40\u0e23\u0e32",
    days: "\u0e27\u0e31\u0e19",
    hours: "\u0e0a\u0e31\u0e48\u0e27\u0e42\u0e21\u0e07",
    minutes: "\u0e19\u0e32\u0e17\u0e35",
    seconds: "\u0e27\u0e34\u0e19\u0e32\u0e17\u0e35",
    rsvpEyebrow: "\u0e42\u0e1b\u0e23\u0e14\u0e15\u0e2d\u0e1a\u0e23\u0e31\u0e1a",
    rsvpTitle: "\u0e04\u0e38\u0e13\u0e08\u0e30\u0e23\u0e48\u0e27\u0e21\u0e09\u0e25\u0e2d\u0e07\u0e01\u0e31\u0e1a\u0e40\u0e23\u0e32\u0e44\u0e2b\u0e21",
    rsvpCopy: "\u0e01\u0e23\u0e38\u0e13\u0e32\u0e01\u0e23\u0e2d\u0e01\u0e41\u0e1a\u0e1a\u0e15\u0e2d\u0e1a\u0e23\u0e31\u0e1a\u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e41\u0e08\u0e49\u0e07\u0e40\u0e23\u0e32\u0e27\u0e48\u0e32\u0e04\u0e38\u0e13\u0e08\u0e30\u0e21\u0e32\u0e23\u0e48\u0e27\u0e21\u0e07\u0e32\u0e19\u0e44\u0e14\u0e49\u0e2b\u0e23\u0e37\u0e2d\u0e44\u0e21\u0e48",
    rsvpButton: "\u0e15\u0e2d\u0e1a\u0e23\u0e31\u0e1a RSVP",
    rsvpNote: "\u0e01\u0e23\u0e38\u0e13\u0e32\u0e15\u0e2d\u0e1a\u0e23\u0e31\u0e1a\u0e20\u0e32\u0e22\u0e43\u0e19\u0e27\u0e31\u0e19\u0e17\u0e35\u0e48 30 \u0e01\u0e31\u0e19\u0e22\u0e32\u0e22\u0e19 \u0e1e.\u0e28. 2569",
    footerDate: "8 \u0e1e\u0e24\u0e28\u0e08\u0e34\u0e01\u0e32\u0e22\u0e19 \u0e1e.\u0e28. 2569",
  },
};

Object.assign(translations.en, {
  photoEyebrow: "The beginning of always",
  photoTitle: "Hand in hand, into forever",
  storyEyebrow: "The moments that brought us here",
  storyTitle: "Every chapter led us closer",
  guestName: "Your name",
  guestNamePlaceholder: "Your full name",
  willAttend: "Will you be joining us?",
  joyfullyAccepts: "Joyfully accepts",
  regretfullyDeclines: "Regretfully declines",
  partySize: "Guests attending, including you",
  chooseGuestCount: "Choose",
  plusOneName: "Your plus-one's name",
  optionalPlaceholder: "Optional",
  dietaryNeeds: "Dietary requirements or allergies",
  dietaryPlaceholder: "Please tell us anything we should know",
  sendRsvp: "Send our RSVP",
  sendingRsvp: "Sending your reply…",
  rsvpSendError: "We could not send your reply. Please check your connection and try again.",
  rsvpThanksTitle: "Thank you, dear guest",
  rsvpThanksNamed: "Thank you, {name}",
  rsvpThanksCopy: "Your reply has been received. We cannot wait to celebrate with you.",
  sendAnotherRsvp: "Send another response",
  giftOffer: "We cannot attend, but we would love to send a wedding gift",
  giftTitle: "A gift sent with love",
  giftCopy: "Your warm wishes already mean so much to us. If you wish, you may use any option below.",
  promptPay: "PromptPay",
  kasikornBank: "Kasikorn Bank",
  kpay: "KPay",
  paymentMethod: "Payment method used",
  choosePaymentMethod: "Choose a payment method",
  giftMessage: "A message for the couple",
  giftMessagePlaceholder: "Share your wishes, blessing or a few words from the heart",
  uploadSlip: "Attach your transfer slip",
  uploadSlipHelp: "Optional · JPG, PNG or WebP · up to 5 MB",
  selectedSlip: "Selected: {name}",
  invalidSlip: "Please choose a JPG, PNG or WebP image.",
  slipTooLarge: "Please choose a slip image smaller than 5 MB.",
  dearGuests: "To our dear family & friends,",
  dayTogether: "A day to remember",
  skipOpening: "Skip to invitation",
  letterNote: "With love, always",
  chooseLanguage: "Choose language",
  openingEyebrow: "A little envelope. A lifetime of love.",
  openingTitle: "Something beautiful awaits",
  letterEyebrow: "You're invited to our wedding",
  openingPrompt: "Sealed with love, just for you",
  openInvitation: "Open invitation",
  scrollExplore: "Scroll to unfold our day",
  replay: "Open the envelope again",
  pauseMotion: "Pause motion",
  resumeMotion: "Resume motion",
  playSound: "Play music",
  muteSound: "Mute music",
});
Object.assign(translations.th, {
  photoEyebrow: "ก่อนคำสัญญา",
  photoTitle: "สิ่งที่ดีที่สุดกำลังจะเริ่มต้น",
  storyEyebrow: "ทุกช่วงเวลาที่พาเรามาถึงวันนี้",
  storyTitle: "ทุกบทของเรื่องราว พาเราใกล้กันยิ่งขึ้น",
  guestName: "ชื่อเล่นของคุณ",
  guestNamePlaceholder: "ชื่อเล่น",
  willAttend: "คุณจะมาร่วมฉลองวันสำคัญกับเราไหม",
  joyfullyAccepts: "ยินดีไปร่วมงาน",
  regretfullyDeclines: "ขออภัย ไม่สามารถไปร่วมงานได้",
  partySize: "จำนวนผู้ร่วมงาน (รวมตัวคุณ)",
  chooseGuestCount: "เลือกจำนวน",
  plusOneName: "ชื่อเล่นของผู้ติดตาม",
  optionalPlaceholder: "ไม่บังคับ",
  dietaryNeeds: "ข้อจำกัดด้านอาหารหรืออาการแพ้",
  dietaryPlaceholder: "โปรดแจ้งสิ่งที่เราควรทราบ",
  sendRsvp: "ส่งคำตอบรับ",
  sendingRsvp: "กำลังส่งคำตอบของคุณ…",
  rsvpSendError: "ไม่สามารถส่งคำตอบได้ โปรดตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง",
  rsvpThanksTitle: "ขอบคุณที่ตอบกลับ",
  rsvpThanksNamed: "ขอบคุณ {name}",
  rsvpThanksCopy: "เราได้รับคำตอบของคุณเรียบร้อยแล้ว ขอบคุณที่แจ้งให้เราทราบ",
  sendAnotherRsvp: "ส่งคำตอบอีกครั้ง",
  giftOffer: "เราไม่สามารถไปร่วมงานได้ แต่ขอส่งของขวัญแต่งงานด้วยความยินดี",
  giftTitle: "ของขวัญที่ส่งมาด้วยความรัก",
  giftCopy: "คำอวยพรของคุณมีความหมายกับเรามาก หากประสงค์สามารถเลือกช่องทางด้านล่างได้",
  promptPay: "พร้อมเพย์",
  kasikornBank: "ธนาคารกสิกรไทย",
  kpay: "KPay",
  paymentMethod: "ช่องทางการโอนเงิน",
  choosePaymentMethod: "เลือกช่องทางการโอน",
  giftMessage: "ข้อความถึงคู่บ่าวสาว",
  giftMessagePlaceholder: "ฝากคำอวยพรหรือข้อความจากใจถึงเรา",
  uploadSlip: "แนบสลิปการโอนเงิน",
  uploadSlipHelp: "ไม่บังคับ · JPG, PNG หรือ WebP · ไม่เกิน 5 MB",
  selectedSlip: "ไฟล์ที่เลือก: {name}",
  invalidSlip: "โปรดเลือกไฟล์ภาพ JPG, PNG หรือ WebP",
  slipTooLarge: "โปรดเลือกภาพสลิปที่มีขนาดไม่เกิน 5 MB",
  dearGuests: "ถึงครอบครัวและเพื่อน ๆ ที่เรารัก",
  dayTogether: "วันแห่งความทรงจำ",
  skipOpening: "ข้ามไปยังการ์ดเชิญ",
  letterNote: "ด้วยรักจากเราสองคน",
  chooseLanguage: "เลือกภาษา",
  openingEyebrow: "ซองเล็ก ๆ กับความรักตลอดไป",
  openingTitle: "ความงดงามกำลังรอคุณอยู่",
  letterEyebrow: "ขอเชิญร่วมงานแต่งงานของเรา",
  openingPrompt: "ส่งถึงคุณด้วยความรัก",
  openInvitation: "เปิดการ์ดเชิญ",
  scrollExplore: "เลื่อนเพื่อชมวันพิเศษของเรา",
  replay: "เปิดซองอีกครั้ง",
  pauseMotion: "หยุดภาพเคลื่อนไหว",
  resumeMotion: "เล่นภาพเคลื่อนไหว",
  playSound: "เปิดเพลง",
  muteSound: "ปิดเพลง",
});

translations.my = {
  photoEyebrow: "ကတိစကားများ မပြောမီ",
  photoTitle: "အကောင်းဆုံးအချိန်တွေက စတင်တော့မယ်",
  storyEyebrow: "ဒီနေ့ဆီ ခေါ်ဆောင်လာခဲ့တဲ့ အခိုက်အတန့်များ",
  storyTitle: "အချိန်တိုင်းက တို့တွေကို ပိုနီးကပ်စေခဲ့တယ်",
  guestName: "သင့်နာမည်",
  guestNamePlaceholder: "အမည်အပြည့်အစုံ",
  willAttend: "ကျွန်တော်ကျွန်မတို့နှင့်အတူ ပါဝင်ဆင်နွှဲမည်လား",
  joyfullyAccepts: "ဝမ်းမြောက်စွာ တက်ရောက်ပါမည်",
  regretfullyDeclines: "ဝမ်းနည်းစွာ မတက်ရောက်နိုင်ပါ",
  partySize: "သင်အပါအဝင် တက်ရောက်မည့်ဦးရေ",
  chooseGuestCount: "ရွေးချယ်ရန်",
  plusOneName: "သင်နှင့်အတူလာမည့်သူ၏ အမည်",
  optionalPlaceholder: "မဖြည့်လည်းရပါသည်",
  dietaryNeeds: "အစားအစာ ကန့်သတ်ချက် သို့မဟုတ် ဓာတ်မတည့်မှု",
  dietaryPlaceholder: "ကျွန်တော်ကျွန်မတို့ သိထားသင့်သည်ကို ပြောပြပေးပါ",
  sendRsvp: "တက်ရောက်မှု အကြောင်းပြန်ပို့ရန်",
  sendingRsvp: "သင့်အကြောင်းပြန်ချက်ကို ပို့နေပါသည်…",
  rsvpSendError: "အကြောင်းပြန်ချက် မပို့နိုင်ပါ။ အင်တာနက်ချိတ်ဆက်မှုကို စစ်ဆေးပြီး ထပ်မံကြိုးစားပါ။",
  rsvpThanksTitle: "ချစ်ခင်ရသောဧည့်သည်ကို ကျေးဇူးတင်ပါသည်",
  rsvpThanksNamed: "ကျေးဇူးတင်ပါတယ်၊ {name}",
  rsvpThanksCopy: "သင့်အကြောင်းပြန်ချက်ကို လက်ခံရရှိပါပြီ။ အတူတကွ ဆင်နွှဲရမည့်နေ့ကို စောင့်မျှော်နေပါသည်။",
  sendAnotherRsvp: "နောက်ထပ် အကြောင်းပြန်ချက် ပို့ရန်",
  giftOffer: "မတက်ရောက်နိုင်သော်လည်း မင်္ဂလာလက်ဖွဲ့ ပေးပို့လိုပါသည်",
  giftTitle: "ချစ်ခြင်းဖြင့် ပေးပို့သော လက်ဆောင်",
  giftCopy: "သင်၏ဆုမွန်ကောင်းများက ကျွန်တော်ကျွန်မတို့အတွက် အလွန်တန်ဖိုးရှိပါသည်။ ဆန္ဒရှိပါက အောက်ပါနည်းလမ်းများမှ ပေးပို့နိုင်ပါသည်။",
  promptPay: "PromptPay",
  kasikornBank: "Kasikorn ဘဏ်",
  kpay: "KPay",
  paymentMethod: "ငွေလွှဲနည်းလမ်း",
  choosePaymentMethod: "ငွေလွှဲနည်းလမ်း ရွေးချယ်ရန်",
  giftMessage: "သတို့သားနှင့် သတို့သမီးအတွက် စာတိုလေး",
  giftMessagePlaceholder: "သင်၏ ဆုမွန်ကောင်း သို့မဟုတ် ရင်တွင်းစကားလေး ရေးပေးပါ",
  uploadSlip: "ငွေလွှဲပြေစာပုံ တွဲရန်",
  uploadSlipHelp: "မဖြည့်လည်းရပါသည် · JPG, PNG သို့မဟုတ် WebP · 5 MB အထိ",
  selectedSlip: "ရွေးထားသောဖိုင်: {name}",
  invalidSlip: "JPG, PNG သို့မဟုတ် WebP ပုံဖိုင်ကို ရွေးချယ်ပါ။",
  slipTooLarge: "5 MB ထက်ငယ်သော ပြေစာပုံကို ရွေးချယ်ပါ။",
  dearGuests: "ချစ်ခင်ရသော မိသားစုနဲ့ မိတ်ဆွေများသို့",
  dayTogether: "အမှတ်တရ နေ့လေးတစ်နေ့",
  skipOpening: "ဖိတ်စာသို့ တိုက်ရိုက်သွားရန်",
  letterNote: "ချစ်ခြင်းမေတ္တာဖြင့် …",
  pageTitle: "Ye နှင့် Nang တို့၏ မင်္ဂလာဖိတ်စာ",
  pageDescription: "Ye Moe Myint နှင့် Nang Htet Htet Aung တို့၏ မင်္ဂလာဖိတ်စာ။",
  chooseLanguage: "ဘာသာစကား ရွေးချယ်ရန်",
  heroEyebrow: "နှစ်ဖက်မိသားစုများနှင့်အတူ",
  heroInvite: "ကျွန်တော်ကျွန်မတို့၏ မင်္ဂလာပွဲသို့ တက်ရောက်ချီးမြှင့်ပေးပါရန် ခင်မင်လေးစားစွာ ဖိတ်ကြားအပ်ပါသည်",
  heroDate: "နိုဝင်ဘာလ ၈ ရက်<br>တနင်္ဂနွေနေ့",
  heroYear: "၂၀၂၆ ခုနှစ်",
  savebarTitle: "ဒီနေ့လေးကိုမှတ်ထားပေးပါနော်",
  saveDate: "Google Calendar တွင် ထည့်ရန်",
  calendarFile: "Apple Calendar နှင့် Outlook",
  details: "အသေးစိတ်",
  celebrateEyebrow: "ချစ်ခြင်းမေတ္တာကို အတူဆင်နွှဲကြမယ်",
  celebrateTitle: "ကျွန်တော်ကျွန်မတို့ လက်ထပ်တော့မည်",
  celebrateCopy: "ဘဝခရီးသစ်ကို စတင်မည့် အထူးနေ့လေးမှာ သင်နှင့်အတူ ပျော်ရွှင်စွာ ဖြတ်သန်းလိုပါသည်။ မင်္ဂလာကတိသစ္စာပြုခြင်း၊ ညစာသုံးဆောင်ခြင်း၊ ကခုန်ခြင်းတို့နှင့်အတူ လှပသော အမှတ်တရများကို ဖန်တီးကြပါစို့။",
  scheduleEyebrow: "မင်္ဂလာနေ့ အစီအစဉ်",
  scheduleDate: "၂၀၂၆ ခုနှစ်၊ နိုဝင်ဘာလ ၈ ရက်၊ တနင်္ဂနွေနေ့",
  welcomeReception: "ဧည့်ကြိုပွဲ",
  betrothalCeremony: "စေ့စပ်ပွဲအခမ်းအနား",
  payingRespectsCeremony: "လူကြီးမိဘများအား ကန်တော့ခြင်းအခမ်းအနား",
  waterPouringCeremony: "စုလျားရစ်ပတ်ပွဲ",
  weddingCelebration: "မင်္ဂလာပွဲအခမ်းအနား",
  timeWelcome: "ညနေ ၃:၀၀",
  timeBetrothal: "ညနေ ၃:၃၀",
  timeRespects: "ညနေ ၅:၀၀",
  timeWater: "ညနေ ၅:၃၀",
  timeCelebration: "ညနေ ၆:၃၀",
  programNote: "အခိုက်အတန့်တိုင်းကို သင်နှင့်အတူ<br>ဆင်နွှဲရန် မျှော်လင့်နေပါသည်",
  ceremony: "မင်္ဂလာအခမ်းအနား",
  reception: "မင်္ဂလာဧည့်ခံပွဲ",
  dinnerDancing: "ညစာနှင့် အကအစီအစဉ်",
  timeTba: "အချိန်ကို ထပ်မံအသိပေးပါမည်",
  detailsSoon: "မင်္ဂလာပွဲ အသေးစိတ်ကို<br>မကြာမီ အသိပေးပါမည်",
  venueLabel: "မင်္ဂလာပွဲ<br>ကျင်းပမည့်နေရာ",
  venueEyebrow: "ကျင်းပမည့်နေရာ",
  venueTitle: "ကျွန်တော်ကျွန်မတို့၏ မင်္ဂလာပွဲနေရာ",
  venueCopy: "တည်နေရာနှင့် လမ်းညွှန်ကို ကြည့်ရှုရန်<br>အောက်ပါ Google Maps လင့်ခ်ကို နှိပ်ပါ။",
  openMaps: "Google Maps တွင် ကြည့်ရန်",
  countdownEyebrow: "နေ့ရက်များကို ရေတွက်ရင်း",
  countdownTitle: "ကျွန်တော်ကျွန်မတို့၏ မင်္ဂလာနေ့အထိ",
  days: "ရက်",
  hours: "နာရီ",
  minutes: "မိနစ်",
  seconds: "စက္ကန့်",
  rsvpEyebrow: "အကြောင်းပြန်ပေးပါရန်",
  rsvpTitle: "ကျွန်တော်ကျွန်မတို့နှင့်အတူ ဆင်နွှဲမည်လား",
  rsvpCopy: "မင်္ဂလာပွဲသို့ တက်ရောက်နိုင်ခြင်း ရှိ၊ မရှိကို RSVP ဖောင်မှတစ်ဆင့် အကြောင်းပြန်ပေးပါရန် မေတ္တာရပ်ခံအပ်ပါသည်။",
  rsvpButton: "တက်ရောက်မှု အကြောင်းပြန်ရန်",
  rsvpNote: "၂၀၂၆ ခုနှစ်၊ စက်တင်ဘာလ ၃၀ ရက် နောက်ဆုံးထား၍ အကြောင်းပြန်ပေးပါရန်",
  footerDate: "၂၀၂၆ ခုနှစ်၊ နိုဝင်ဘာလ ၈ ရက်",
  openingEyebrow: "ဖိတ်စာလေးတစ်စောင်၊ တစ်သက်တာချစ်ခြင်းမေတ္တာ",
  openingTitle: "လှပသော အခိုက်အတန့်လေးက စောင့်ကြိုနေပါတယ်",
  letterEyebrow: "ကျွန်တော်ကျွန်မတို့၏ မင်္ဂလာပွဲသို့ ဖိတ်ကြားအပ်ပါသည်",
  openingPrompt: "ချစ်ခြင်းမေတ္တာဖြင့် …",
  openInvitation: "မင်္ဂလာဖိတ်စာကို ဖွင့်ရန်",
  scrollExplore: "မင်္ဂလာပွဲအစီအစဉ်ကို ကြည့်ရန် အောက်သို့ ဆွဲပါ",
  replay: "ဖိတ်စာအိတ်ကို ပြန်ဖွင့်ရန်",
  pauseMotion: "လှုပ်ရှားမှု ရပ်ရန်",
  resumeMotion: "လှုပ်ရှားမှု ပြန်စရန်",
  playSound: "တေးဂီတ ဖွင့်ရန်",
  muteSound: "တေးဂီတ ပိတ်ရန်",
};

// Warm, guest-facing wedding copy. These overrides keep the Thai and Myanmar
// versions conversational and celebratory instead of reading like translations.
Object.assign(translations.th, {
  photoEyebrow: "จุดเริ่มต้นของคำว่า ‘ตลอดไป’",
  photoTitle: "จับมือกัน สู่วันตลอดไป",
  storyEyebrow: "ทุกช่วงเวลาที่พาเรามาถึงวันนี้",
  storyTitle: "ทุกบทของเรื่องราว พาเราใกล้กันยิ่งขึ้น",
  heroEyebrow: "พร้อมด้วยครอบครัวของเราทั้งสอง",
  heroInvite: "มีความยินดีขอเชิญท่านร่วมเป็นสักขีพยานในพิธีมงคลสมรสของ",
  celebrateEyebrow: "ร่วมฉลองความรักของเรา",
  celebrateTitle: "เรากำลังจะแต่งงานกัน",
  celebrateCopy: "เราจะยินดีอย่างยิ่งที่ได้มีคุณอยู่เคียงข้างในวันเริ่มต้นบทใหม่ของชีวิต มาร่วมเป็นสักขีพยานในพิธีแห่งคำมั่นสัญญา รับประทานอาหาร และเฉลิมฉลองช่วงเวลาพิเศษนี้ไปด้วยกัน",
  scheduleEyebrow: "กำหนดการวันสำคัญ",
  programNote: "เราดีใจที่จะได้ร่วมแบ่งปัน<br>ทุกช่วงเวลาสำคัญกับคุณ",
  venueEyebrow: "สถานที่แห่งวันสำคัญ",
  venueTitle: "สถานที่จัดงานของเรา",
  venueCopy: "แตะด้านล่างเพื่อดูสถานที่<br>และเส้นทางบน Google Maps",
  countdownEyebrow: "นับถอยหลังสู่วันของเรา",
  countdownTitle: "อีกไม่นาน เราจะได้พูดคำว่า ‘แต่งงานกันนะ’",
  rsvpEyebrow: "กรุณาตอบรับ",
  rsvpTitle: "มาร่วมฉลองกับเราไหม",
  rsvpCopy: "โปรดแจ้งให้เราทราบว่าคุณจะมาร่วมวันสำคัญของเราได้หรือไม่",
  rsvpNote: "กรุณาตอบกลับภายในวันที่ 30 กันยายน พ.ศ. 2569",
  openingEyebrow: "คำเชิญจากหัวใจ",
  openingTitle: "เรื่องราวบทใหม่กำลังจะเริ่มต้น",
  letterEyebrow: "ขอเชิญร่วมเป็นส่วนหนึ่งในวันสำคัญของเรา",
  openingPrompt: "ส่งถึงคุณด้วยความรัก",
  openInvitation: "เปิดคำเชิญ",
  scrollExplore: "เลื่อนลงเพื่อร่วมเดินทางไปกับเรา",
});

Object.assign(translations.my, {
  photoEyebrow: "",
  photoTitle: "တွဲလက်များ ထာဝရဆီသို့ …",
  storyEyebrow: "ဒီနေ့ဆီ ခေါ်ဆောင်လာခဲ့တဲ့ အခိုက်အတန့်များ",
  storyTitle: "အချိန်တိုင်းက တို့တွေကို ပိုနီးကပ်စေခဲ့တယ်",
  heroEyebrow: "နှစ်ဖက်မိသားစုများနှင့်အတူ",
  heroInvite: "ကျွန်တော်ကျွန်မတို့၏ မင်္ဂလာပွဲသို့ တက်ရောက်ချီးမြှင့်ပေးပါရန် ခင်မင်လေးစားစွာ ဖိတ်ကြားအပ်ပါသည်",
  celebrateEyebrow: "ကျွန်တော်ကျွန်မတို့ရဲ့ အချစ်ကို အတူဂုဏ်ပြုကြမယ်",
  celebrateTitle: "ကျွန်တော်ကျွန်မတို့ လက်ထပ်တော့မယ်",
  celebrateCopy: "ဒီလိုထူးခြားတဲ့နေ့ရက် အခိုက်တန့်လေးမှာ သင်တို့နဲ့တူတူရှိခွင့်ရရင် အရမ်းကြည်နူးမိမှာပါ။ ဒီအခိုက်အတန့်လေးနဲ့အတူ အမှတ်တရများကို တူတူဝေမျှကြရအောင်။",
  scheduleEyebrow: "မင်္ဂလာနေ့ အစီအစဉ်",
  welcomeReception: "ဧည့်ကြိုပွဲ",
  betrothalCeremony: "စေ့စပ်ပွဲအခမ်းအနား",
  payingRespectsCeremony: "မိဘနှင့် လူကြီးများအား ကန်တော့ခြင်း",
  waterPouringCeremony: "စုလျားရစ်ပတ်ပွဲ",
  weddingCelebration: "မင်္ဂလာဧည့်ခံပွဲ",
  programNote: "အရေးကြီးတဲ့ အခိုက်အတန့်တိုင်းကို<br>သင်နဲ့အတူ မျှဝေဖို့ မျှော်လင့်နေပါတယ်",
  venueEyebrow: "ကျွန်တော်ကျွန်မတို့ရဲ့ နေ့ထူးနေ့မြတ်နေရာ",
  venueTitle: "မင်္ဂလာပွဲကျင်းပမည့်နေရာ",
  venueCopy: "တည်နေရာနှင့် လမ်းညွှန်ကို ကြည့်ရန်<br>အောက်ပါ Google Maps လင့်ခ်ကို နှိပ်ပါ",
  countdownEyebrow: "ကျွန်တော်ကျွန်မတို့ရဲ့နေ့အတွက် ရေတွက်ရင်း",
  countdownTitle: "‘လက်ထပ်ကြမယ်’ လို့ ပြောမယ့်နေ့အထိ",
  rsvpEyebrow: "အကြောင်းပြန်ပေးပါရန်",
  rsvpTitle: "ကျွန်တော်ကျွန်မတို့နဲ့အတူ လာရောက်ဆင်နွှဲမလား",
  rsvpCopy: "ကျွန်တော်ကျွန်မတို့ရဲ့ နေ့ထူးနေ့မြတ်ကို အတူဆင်နွှဲနိုင်မလားဆိုတာ အသိပေးပါနော်",
  rsvpNote: "၂၀၂၆ ခုနှစ်၊ စက်တင်ဘာလ ၃၀ ရက် နောက်ဆုံးထားပြီး အကြောင်းပြန်ပေးပါရန်",
  openingEyebrow: "နှလုံးသားမှဖိတ်ကြားလွှာ",
  openingTitle: "",
  letterEyebrow: "ကျွန်တော်ကျွန်မတို့ရဲ့ နေ့ထူးနေ့မြတ်ကို အတူဆင်နွှဲပေးပါ",
  openingPrompt: "ချစ်ခြင်းမေတ္တာဖြင့် …",
  openInvitation: "ဖိတ်စာဖွင့်ရန်",
  scrollExplore: "အမှတ်တရနေ့စွဲလေးကိုကြည့်ရန် အောက်ကိုဆွဲပါ",
});

function photoText(value, language) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[language] || value.en || "";
}

function updateWeddingPhotoLanguage(language = document.documentElement.lang) {
  const moments = window.WEDDING_PHOTOS?.moments || [];
  document.querySelectorAll("[data-photo-index]").forEach((element) => {
    const moment = moments[Number(element.dataset.photoIndex)];
    if (!moment) return;
    const image = element.matches("img") ? element : element.querySelector("img");
    if (image) image.alt = photoText(moment.alt, language);
    const caption = element.querySelector?.("figcaption");
    const copy = photoText(moment.caption, language);
    if (caption) {
      caption.textContent = copy;
      caption.hidden = !copy;
    }
  });
  document.querySelectorAll("[data-photo-caption]").forEach((element) => {
    const moment = moments[Number(element.dataset.photoCaption)];
    if (moment) element.textContent = photoText(moment.caption, language);
  });
}

function updateRsvpThankYou(language = document.documentElement.lang) {
  const title = document.querySelector(".rsvp-thanks h3");
  if (!title) return;
  const copy = translations[language] || translations.en;
  title.textContent = lastRsvpName ? copy.rsvpThanksNamed.replace("{name}", lastRsvpName) : copy.rsvpThanksTitle;
}

function initializeWeddingPhotos() {
  const section = document.querySelector(".photo-story");
  const configuration = window.WEDDING_PHOTOS;
  const moments = configuration?.enabled && Array.isArray(configuration.moments)
    ? configuration.moments.filter(moment => moment?.src)
    : [];
  if (!section || !moments.length) return;

  document.querySelectorAll("[data-story-photo]").forEach(image => {
    const index = Number(image.dataset.storyPhoto);
    const moment = configuration.moments[index];
    const photoSection = image.closest("section");
    if (!moment?.src) {
      photoSection?.setAttribute("hidden", "");
      return;
    }
    image.src = moment.src;
    image.style.objectPosition = moment.focus || "50% 50%";
    image.dataset.photoIndex = String(index);
    photoSection?.removeAttribute("hidden");
    image.addEventListener("error", () => photoSection?.setAttribute("hidden", ""));
  });

  section.hidden = false;
  document.body.classList.add("has-wedding-photos");
  updateWeddingPhotoLanguage();
}

function updateCountdown() {
  const remaining = Math.max(0, weddingDate.getTime() - Date.now());
  const totalSeconds = Math.floor(remaining / 1000);
  const values = {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };

  const animateChanges = !motionPaused && !document.hidden && invitationIntro.hidden && countdownVisible;
  for (const [unit, value] of Object.entries(values)) {
    const nextValue = String(value).padStart(2, "0");
    const element = units[unit];
    if (element.textContent === nextValue) continue;
    element.textContent = nextValue;
    if (animateChanges) {
      element.animate([{ opacity: .45, transform: "translateY(5px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 350, easing: "ease-out" });
    }
  }
}

function setLanguage(language) {
  language = ["en", "th", "my"].includes(language) ? language : "en";
  const copy = translations[language];
  document.documentElement.lang = language;
  document.title = copy.pageTitle;
  document.querySelector('meta[name="description"]').setAttribute("content", copy.pageDescription);

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = copy[element.dataset.i18n];
  });
  document.querySelectorAll("[data-i18n-html]").forEach((element) => {
    element.innerHTML = copy[element.dataset.i18nHtml];
  });
  document.querySelectorAll("[data-i18n-aria]").forEach(element => element.setAttribute("aria-label", copy[element.dataset.i18nAria]));
  document.querySelectorAll("[data-i18n-placeholder]").forEach(element => element.setAttribute("placeholder", copy[element.dataset.i18nPlaceholder]));
  updateWeddingPhotoLanguage(language);
  updateRsvpThankYou(language);
  refreshMotionButton();
  refreshSoundButton();
  if (soundEnabled && invitationIntro.hidden) startMusic(language);
  document.querySelectorAll("[data-language]").forEach((button) => {
    const isActive = button.dataset.language === language;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  try {
    window.localStorage.setItem("invitation-language", language);
  } catch {
    // The invitation still works when browser storage is unavailable.
  }
}

document.querySelectorAll("[data-language]").forEach((button) => {
  button.addEventListener("click", () => setLanguage(button.dataset.language));
});

function initializeRsvp() {
  const form = document.querySelector(".rsvp-form");
  const thanks = document.querySelector(".rsvp-thanks");
  const status = form.querySelector(".rsvp-form__status");
  const submit = form.querySelector(".rsvp-form__submit");
  const attendingDetails = form.querySelectorAll("[data-attending-details]");
  const guestDetails = form.querySelector(".rsvp-guest-details");
  const guestCount = form.elements.namedItem("entry.1498135098");
  const plusOneField = form.querySelector("[data-plus-one-field]");
  const plusOne = form.elements.namedItem("entry.1424661284");
  const giftSection = form.querySelector("[data-gift-section]");
  const giftIntent = form.querySelector("[data-gift-intent]");
  const giftDetails = form.querySelector("[data-gift-details]");
  const giftMethod = form.querySelector("[data-gift-method]");
  const giftMessage = form.querySelector("[data-gift-message]");
  const giftSlip = form.querySelector("[data-gift-slip]");
  const giftFilename = form.querySelector("[data-gift-filename]");
  const acceptanceValue = "Joyfully accepts / ยินดีเข้าร่วมงาน";
  const declineValue = "Regretfully declines / ขออภัย ไม่สามารถเข้าร่วมงานได้";
  const giftSlipTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  const maxGiftSlipBytes = 5 * 1024 * 1024;
  form.dataset.rsvpStartedAt = String(Date.now());

  function setPlusOneRequired(required) {
    plusOneField.hidden = !required;
    plusOne.disabled = !required;
    plusOne.required = required;
    guestDetails.classList.toggle("is-single-guest", !required);
  }

  function setAttendingDetails(attending) {
    attendingDetails.forEach(section => {
      section.hidden = !attending;
      section.querySelectorAll("input, select, textarea").forEach(control => { control.disabled = !attending; });
    });
    if (attending && !guestCount.value) guestCount.value = "1";
    setPlusOneRequired(attending && guestCount.value === "2");
  }

  function setGiftDetails(enabled) {
    giftDetails.hidden = !enabled;
    giftMethod.disabled = !enabled;
    giftMethod.required = enabled;
    giftMessage.disabled = !enabled;
    giftSlip.disabled = !enabled;
    if (!enabled) {
      giftMethod.value = "";
      giftMessage.value = "";
      giftSlip.value = "";
      giftFilename.textContent = "";
    }
  }

  function setGiftSection(visible) {
    giftSection.hidden = !visible;
    giftIntent.disabled = !visible;
    if (!visible) giftIntent.checked = false;
    setGiftDetails(visible && giftIntent.checked);
  }

  function validGiftSlip(file) {
    if (!file) return true;
    return giftSlipTypes.has(file.type) && file.size <= maxGiftSlipBytes;
  }

  form.querySelectorAll('input[name="entry.877086558"]').forEach(choice => {
    choice.addEventListener("change", () => {
      const attending = choice.value === acceptanceValue;
      setAttendingDetails(attending);
      setGiftSection(!attending);
    });
  });
  guestCount.addEventListener("change", () => setPlusOneRequired(guestCount.value === "2"));
  giftIntent.addEventListener("change", () => setGiftDetails(giftIntent.checked));
  giftSlip.addEventListener("change", () => {
    const file = giftSlip.files?.[0];
    const copy = translations[document.documentElement.lang] || translations.en;
    status.textContent = "";
    if (!file) { giftFilename.textContent = ""; return; }
    if (!giftSlipTypes.has(file.type)) {
      giftSlip.value = "";
      giftFilename.textContent = "";
      status.textContent = copy.invalidSlip;
      return;
    }
    if (file.size > maxGiftSlipBytes) {
      giftSlip.value = "";
      giftFilename.textContent = "";
      status.textContent = copy.slipTooLarge;
      return;
    }
    giftFilename.textContent = copy.selectedSlip.replace("{name}", file.name);
  });
  setPlusOneRequired(guestCount.value === "2");
  setGiftSection(false);

  form.addEventListener("submit", async event => {
    if (!("fetch" in window)) return;
    event.preventDefault();
    if (!form.reportValidity()) return;
    const copy = translations[document.documentElement.lang] || translations.en;
    const slip = giftSlip.files?.[0];
    if (!validGiftSlip(slip)) {
      status.textContent = slip?.size > maxGiftSlipBytes ? copy.slipTooLarge : copy.invalidSlip;
      giftSlip.focus({ preventScroll: true });
      return;
    }
    submit.disabled = true;
    form.classList.add("is-submitting");
    status.textContent = copy.sendingRsvp;
    const responseName = form.elements.namedItem("entry.1459528256").value.trim();
    try {
      const apiUrl = typeof window.RSVP_API_URL === "string" ? window.RSVP_API_URL.trim() : "";
      if (!apiUrl) throw new Error("RSVP service is not configured.");
      const formData = new FormData(form);
      const attendanceValue = formData.get("entry.877086558");
      const payload = {
        name: responseName,
        attendance: attendanceValue === acceptanceValue ? "accept" : attendanceValue === declineValue ? "decline" : "",
        partySize: attendanceValue === declineValue ? "0" : formData.get("entry.1498135098"),
        plusOne: attendanceValue === declineValue ? "" : formData.get("entry.1424661284") || "",
        dietary: attendanceValue === declineValue ? "" : formData.get("entry.649557088") || "",
        giftIntent: attendanceValue === declineValue && giftIntent.checked,
        giftPaymentMethod: attendanceValue === declineValue && giftIntent.checked ? giftMethod.value : "",
        giftMessage: attendanceValue === declineValue && giftIntent.checked ? giftMessage.value.trim() : "",
        language: document.documentElement.lang || "en",
        website: formData.get("website") || "",
        startedAt: Number(form.dataset.rsvpStartedAt)
      };
      let body = JSON.stringify(payload);
      const headers = { "content-type": "application/json" };
      if (slip) {
        body = new FormData();
        body.append("payload", JSON.stringify(payload));
        body.append("slip", slip, slip.name);
        delete headers["content-type"];
      }
      const response = await fetch(apiUrl, { method: "POST", headers, body });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error || "RSVP could not be saved.");
      form.hidden = true;
      thanks.hidden = false;
      lastRsvpName = responseName;
      updateRsvpThankYou();
      thanks.focus?.({ preventScroll: true });
      thanks.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    } catch {
      submit.disabled = false;
      form.classList.remove("is-submitting");
      status.textContent = copy.rsvpSendError;
      status.focus?.({ preventScroll: true });
    }
  });

  document.querySelector(".rsvp-again").addEventListener("click", () => {
    lastRsvpName = "";
    form.reset();
    form.dataset.rsvpStartedAt = String(Date.now());
    setAttendingDetails(true);
    guestCount.value = "";
    setGiftSection(false);
    submit.disabled = false;
    form.classList.remove("is-submitting");
    status.textContent = "";
    thanks.hidden = true;
    form.hidden = false;
    updateRsvpThankYou();
    form.querySelector('input[name="entry.1459528256"]').focus({ preventScroll: true });
  });
}

let savedLanguage = "en";
try { savedLanguage = window.localStorage.getItem("invitation-language") || "en"; } catch { /* Storage is optional. */ }
const requestedLanguage = new URLSearchParams(window.location.search).get("lang");
initializeWeddingPhotos();
setLanguage(requestedLanguage ?? savedLanguage);

updateCountdown();
window.setInterval(updateCountdown, 1000);
initializeRsvp();
initializeInvitation();



