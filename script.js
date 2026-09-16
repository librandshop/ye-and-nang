const invitationIntro = document.querySelector(".invitation-intro");
const openInvitation = document.querySelector(".envelope");
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const motionButton = document.querySelector(".motion-toggle");
const soundButton = document.querySelector(".sound-toggle");
const pageContent = [...document.querySelectorAll(".site-header, main, footer")];
let motionPaused = motionPreference.matches;
let openingTimer;
let revealObserver;
let lastRsvpName = "";
const openingSkip = document.querySelector(".opening-skip");
const openingDuration = 6600;
let audioContext;
let masterGain;
let effectsGain;
let musicGain;
let soundEnabled = false;
let soundChoiceMade = false;
let musicLoop;
const openingAudioNodes = new Set();
const musicAudioNodes = new Set();

function ensureAudio() {
  if (audioContext) return true;
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  if (!AudioEngine) return false;
  try {
    audioContext = new AudioEngine();
    masterGain = audioContext.createGain();
    effectsGain = audioContext.createGain();
    musicGain = audioContext.createGain();
    masterGain.gain.value = .72;
    effectsGain.gain.value = .72;
    musicGain.gain.value = .5;
    effectsGain.connect(masterGain);
    musicGain.connect(masterGain);
    masterGain.connect(audioContext.destination);
    return true;
  } catch { return false; }
}

function stopNodes(nodes) {
  nodes.forEach(node => { try { node.stop(); } catch { /* Already finished. */ } });
  nodes.clear();
}

function scheduleTone(frequency, start, duration, volume, destination, type = "sine", nodes = openingAudioNodes, endFrequency) {
  if (!audioContext || !destination) return;
  const oscillator = audioContext.createOscillator();
  const envelope = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration * .78);
  envelope.gain.setValueAtTime(.0001, start);
  envelope.gain.exponentialRampToValueAtTime(volume, start + Math.min(.045, duration * .16));
  envelope.gain.exponentialRampToValueAtTime(.0001, start + duration);
  oscillator.connect(envelope).connect(destination);
  nodes.add(oscillator);
  oscillator.addEventListener("ended", () => nodes.delete(oscillator), { once:true });
  oscillator.start(start);
  oscillator.stop(start + duration + .03);
}

function scheduleRustle(start, duration, volume, frequency = 900) {
  if (!audioContext || !effectsGain) return;
  const frameCount = Math.max(1, Math.floor(audioContext.sampleRate * duration));
  const buffer = audioContext.createBuffer(1, frameCount, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / frameCount);
  const source = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  const envelope = audioContext.createGain();
  filter.type = "bandpass";
  filter.frequency.value = frequency;
  filter.Q.value = .65;
  envelope.gain.setValueAtTime(.0001, start);
  envelope.gain.exponentialRampToValueAtTime(volume, start + .04);
  envelope.gain.exponentialRampToValueAtTime(.0001, start + duration);
  source.buffer = buffer;
  source.connect(filter).connect(envelope).connect(effectsGain);
  openingAudioNodes.add(source);
  source.addEventListener("ended", () => openingAudioNodes.delete(source), { once:true });
  source.start(start);
}

function playOpeningSoundscape() {
  if (!soundEnabled || !ensureAudio()) return;
  stopNodes(openingAudioNodes);
  const now = audioContext.currentTime + .035;
  scheduleTone(523.25, now, .5, .042, effectsGain, "sine");
  scheduleTone(783.99, now + .025, .64, .022, effectsGain, "triangle");
  scheduleRustle(now + .28, .72, .032, 2200);
  scheduleRustle(now + 1.02, 1.05, .04, 1050);
  scheduleTone(329.63, now + 1.26, 1.25, .025, effectsGain, "sine", openingAudioNodes, 493.88);
  scheduleTone(659.25, now + 2.65, .68, .022, effectsGain, "triangle");
  scheduleRustle(now + 3.1, 1.45, .046, 1350);
  scheduleRustle(now + 4.2, .9, .028, 2600);
  [523.25, 659.25, 783.99, 987.77].forEach((note, index) => scheduleTone(note, now + 5.65 + index * .075, 1.45, .024, effectsGain, index % 2 ? "triangle" : "sine"));
}

const scores = {
  en: { beat:.56, type:"triangle", notes:[60,64,67,69,67,64,62,67,65,69,72,69,67,64,62,59] },
  th: { beat:.5, type:"sine", notes:[62,64,66,69,71,69,66,64,62,66,69,74,71,69,66,64] },
  my: { beat:.54, type:"triangle", notes:[60,62,64,67,69,67,64,62,60,64,67,72,69,67,64,62] },
};

function midiToFrequency(note) { return 440 * (2 ** ((note - 69) / 12)); }

function scheduleMusicPhrase(language) {
  if (!soundEnabled || document.hidden || !audioContext || !musicGain) return;
  const score = scores[language] || scores.en;
  const start = audioContext.currentTime + .08;
  score.notes.forEach((note, index) => {
    const time = start + index * score.beat;
    const accent = index % 4 === 0;
    scheduleTone(midiToFrequency(note), time, score.beat * 1.7, accent ? .025 : .016, musicGain, score.type, musicAudioNodes);
    if (accent) scheduleTone(midiToFrequency(note - 12), time, score.beat * 3.1, .012, musicGain, "sine", musicAudioNodes);
  });
}

function stopMusic() {
  window.clearInterval(musicLoop);
  musicLoop = undefined;
  stopNodes(musicAudioNodes);
  document.body.classList.remove("music-playing");
}

function startMusic(language = document.documentElement.lang) {
  stopMusic();
  if (!soundEnabled || document.hidden || !invitationIntro.hidden || !ensureAudio()) return;
  document.body.dataset.score = language;
  document.body.classList.add("music-playing");
  scheduleMusicPhrase(language);
  const phraseLength = (scores[language] || scores.en).beat * 16 * 1000;
  musicLoop = window.setInterval(() => scheduleMusicPhrase(document.documentElement.lang), phraseLength);
}

function refreshSoundButton() {
  const copy = translations[document.documentElement.lang] || translations.en;
  soundButton.querySelector(".sound-toggle__label").textContent = soundEnabled ? copy.muteSound : copy.playSound;
  soundButton.querySelector(".sound-toggle__icon").textContent = soundEnabled ? "♫" : "♪";
  soundButton.setAttribute("aria-pressed", String(soundEnabled));
  soundButton.classList.toggle("is-active", soundEnabled);
}

function setSoundEnabled(enabled, userChoice = true) {
  if (userChoice) soundChoiceMade = true;
  soundEnabled = enabled && ensureAudio();
  document.body.classList.toggle("sound-enabled", soundEnabled);
  if (soundEnabled) {
    audioContext.resume().catch(() => {});
    if (invitationIntro.hidden) startMusic();
  } else {
    stopNodes(openingAudioNodes);
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
  stopNodes(openingAudioNodes);
  if (soundEnabled) {
    const now = audioContext.currentTime + .025;
    [523.25, 659.25, 783.99].forEach((note, index) => scheduleTone(note, now + index * .06, 1.25, .02, effectsGain, "sine"));
    window.setTimeout(() => startMusic(), 420);
  }
  document.querySelector("#couple-names").focus({ preventScroll: true });
  observeReveals();
}

function revealInvitation() {
  if (invitationIntro.hidden || document.body.classList.contains("invitation-opening")) return;
  if (!soundChoiceMade) setSoundEnabled(true, false);
  else if (soundEnabled) audioContext?.resume().catch(() => {});
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
  stopNodes(openingAudioNodes);
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
  openInvitation.focus({ preventScroll: true });
}

function observeReveals() {
  const elements = document.querySelectorAll("[data-reveal]");
  if (motionPaused || !("IntersectionObserver" in window)) {
    elements.forEach(element => element.classList.add("is-visible"));
    return;
  }
  revealObserver ??= new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: .12, rootMargin: "0px 0px -25px 0px" });
  elements.forEach(element => revealObserver.observe(element));
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
  document.querySelectorAll(".opening-petals i").forEach((petal, index) => {
    const angle = index * Math.PI * 2 / 12;
    petal.style.setProperty("--petal-order", index);
    petal.style.setProperty("--petal-x", `${Math.cos(angle) * Math.min(innerWidth * .48, 400)}px`);
    petal.style.setProperty("--petal-y", `${Math.sin(angle) * innerHeight * .36 + innerHeight * .2}px`);
    petal.style.setProperty("--petal-turn", `${120 + index * 37}deg`);
  });
  document.querySelectorAll(".opening-stars i").forEach((star, index) => star.style.setProperty("--star-order", index));
  document.querySelectorAll(".hero__copy-inner > *").forEach((element, index) => element.style.setProperty("--order", index));
  const groups = [
    ".savebar__copy, .calendar-actions", ".intro__heading, .intro__copy", ".photo-story:not([hidden]) .photo-story__heading, .photo-story:not([hidden]) .photo-frame",
    ".schedule > .container > .eyebrow, .schedule h2", ".schedule-card", ".love-divider, .program-note, .letter-bow--reply",
    ".venue__visual, .venue__copy", ".countdown .eyebrow, .countdown h2",
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
  function updateProgress() {
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    const readingProgress = distance > 0 ? Math.min(1, window.scrollY / distance) : 0;
    progress.style.setProperty("--reading-progress", readingProgress);
    progress.style.transform = `scaleX(${readingProgress})`;
    weddingLetter.style.setProperty("--paper-light", `${18 + readingProgress * 64}%`);
    document.body.classList.toggle("controls-compact", invitationIntro.hidden && window.scrollY > Math.min(420, window.innerHeight * .52));
    if (!motionPaused && invitationIntro.hidden) {
      const heroBounds = hero.getBoundingClientRect();
      if (heroBounds.bottom > 0) hero.style.setProperty("--flower-depth", `${Math.min(window.scrollY * .09, 70)}px`);
      const artBounds = venueArt.getBoundingClientRect();
      if (artBounds.bottom > 0 && artBounds.top < innerHeight) {
        const travel = Math.max(0, Math.min(1, (innerHeight - artBounds.top) / (innerHeight + artBounds.height)));
        venueArt.style.setProperty("--paper-angle", `${-10 + travel * 9}deg`);
        venueArt.style.setProperty("--paper-lift", `${16 - travel * 32}px`);
      }
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
  photoEyebrow: "A glimpse of us",
  photoTitle: "Our love, in photographs",
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
  photoEyebrow: "ภาพเล็ก ๆ ของเรา",
  photoTitle: "เรื่องราวความรักผ่านภาพถ่าย",
  guestName: "ชื่อของคุณ",
  guestNamePlaceholder: "ชื่อ-นามสกุล",
  willAttend: "คุณจะมาร่วมงานกับเราไหม",
  joyfullyAccepts: "ยินดีเข้าร่วมงาน",
  regretfullyDeclines: "ขออภัย ไม่สามารถเข้าร่วมได้",
  partySize: "จำนวนผู้เข้าร่วม รวมคุณ",
  chooseGuestCount: "เลือกจำนวน",
  plusOneName: "ชื่อผู้ติดตามของคุณ",
  optionalPlaceholder: "ไม่บังคับ",
  dietaryNeeds: "ข้อจำกัดด้านอาหารหรืออาการแพ้",
  dietaryPlaceholder: "โปรดแจ้งสิ่งที่เราควรทราบ",
  sendRsvp: "ส่งคำตอบรับ",
  sendingRsvp: "กำลังส่งคำตอบของคุณ…",
  rsvpSendError: "ไม่สามารถส่งคำตอบได้ โปรดตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง",
  rsvpThanksTitle: "ขอบคุณแขกคนพิเศษของเรา",
  rsvpThanksNamed: "ขอบคุณ {name}",
  rsvpThanksCopy: "เราได้รับคำตอบของคุณแล้ว และแทบรอไม่ไหวที่จะได้ฉลองด้วยกัน",
  sendAnotherRsvp: "ส่งคำตอบอื่น",
  dearGuests: "ถึงครอบครัวและเพื่อน ๆ ที่รัก",
  dayTogether: "วันแห่งความทรงจำ",
  skipOpening: "ข้ามไปยังการ์ดเชิญ",
  letterNote: "ด้วยรักเสมอ",
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
  photoEyebrow: "ကျွန်ုပ်တို့ရဲ့ အမှတ်တရပုံရိပ်များ",
  photoTitle: "ဓာတ်ပုံများထဲက ကျွန်ုပ်တို့ရဲ့ အချစ်ဇာတ်လမ်း",
  guestName: "သင့်နာမည်",
  guestNamePlaceholder: "အမည်အပြည့်အစုံ",
  willAttend: "ကျွန်ုပ်တို့နှင့်အတူ ပါဝင်ဆင်နွှဲမည်လား",
  joyfullyAccepts: "ဝမ်းမြောက်စွာ တက်ရောက်ပါမည်",
  regretfullyDeclines: "ဝမ်းနည်းစွာ မတက်ရောက်နိုင်ပါ",
  partySize: "သင်အပါအဝင် တက်ရောက်မည့်ဦးရေ",
  chooseGuestCount: "ရွေးချယ်ရန်",
  plusOneName: "သင်နှင့်အတူလာမည့်သူ၏ အမည်",
  optionalPlaceholder: "မဖြည့်လည်းရပါသည်",
  dietaryNeeds: "အစားအစာ ကန့်သတ်ချက် သို့မဟုတ် ဓာတ်မတည့်မှု",
  dietaryPlaceholder: "ကျွန်ုပ်တို့ သိထားသင့်သည်ကို ပြောပြပေးပါ",
  sendRsvp: "တက်ရောက်မှု အကြောင်းပြန်ပို့ရန်",
  sendingRsvp: "သင့်အကြောင်းပြန်ချက်ကို ပို့နေပါသည်…",
  rsvpSendError: "အကြောင်းပြန်ချက် မပို့နိုင်ပါ။ အင်တာနက်ချိတ်ဆက်မှုကို စစ်ဆေးပြီး ထပ်မံကြိုးစားပါ။",
  rsvpThanksTitle: "ချစ်ခင်ရသောဧည့်သည်ကို ကျေးဇူးတင်ပါသည်",
  rsvpThanksNamed: "ကျေးဇူးတင်ပါတယ်၊ {name}",
  rsvpThanksCopy: "သင့်အကြောင်းပြန်ချက်ကို လက်ခံရရှိပါပြီ။ အတူတကွ ဆင်နွှဲရမည့်နေ့ကို စောင့်မျှော်နေပါသည်။",
  sendAnotherRsvp: "နောက်ထပ် အကြောင်းပြန်ချက် ပို့ရန်",
  dearGuests: "ချစ်ရသော မိသားစုနှင့် မိတ်ဆွေများသို့",
  dayTogether: "အမှတ်တရ နေ့လေးတစ်နေ့",
  skipOpening: "ဖိတ်စာသို့ တိုက်ရိုက်သွားရန်",
  letterNote: "ချစ်ခြင်းမေတ္တာဖြင့် အမြဲတမ်း",
  pageTitle: "Ye နှင့် Nang တို့၏ မင်္ဂလာဖိတ်စာ",
  pageDescription: "Ye Moe Myint နှင့် Nang Htet Htet Aung တို့၏ မင်္ဂလာဖိတ်စာ။",
  chooseLanguage: "ဘာသာစကား ရွေးချယ်ရန်",
  heroEyebrow: "နှစ်ဖက်မိသားစုများနှင့်အတူ",
  heroInvite: "ကျွန်ုပ်တို့၏ မင်္ဂလာပွဲသို့ ကြွရောက်ချီးမြှင့်ပေးပါရန် လေးစားစွာ ဖိတ်ကြားအပ်ပါသည်",
  heroDate: "နိုဝင်ဘာလ ၈ ရက်<br>တနင်္ဂနွေနေ့",
  heroYear: "၂၀၂၆ ခုနှစ်",
  savebarTitle: "အမှတ်တရနေ့လေးကို မှတ်သားထားပေးပါ",
  saveDate: "Google Calendar တွင် ထည့်ရန်",
  calendarFile: "Apple Calendar နှင့် Outlook",
  details: "အသေးစိတ်",
  celebrateEyebrow: "ချစ်ခြင်းမေတ္တာကို အတူဆင်နွှဲကြမယ်",
  celebrateTitle: "ကျွန်ုပ်တို့ လက်ထပ်တော့မည်",
  celebrateCopy: "ဘဝခရီးသစ်ကို စတင်မည့် အထူးနေ့လေးမှာ သင်နှင့်အတူ ပျော်ရွှင်စွာ ဖြတ်သန်းလိုပါသည်။ မင်္ဂလာကတိသစ္စာပြုခြင်း၊ ညစာသုံးဆောင်ခြင်း၊ ကခုန်ခြင်းတို့နှင့်အတူ လှပသော အမှတ်တရများကို ဖန်တီးကြပါစို့။",
  scheduleEyebrow: "မင်္ဂလာနေ့ အစီအစဉ်",
  scheduleDate: "၂၀၂၆ ခုနှစ်၊ နိုဝင်ဘာလ ၈ ရက်၊ တနင်္ဂနွေနေ့",
  ceremony: "မင်္ဂလာအခမ်းအနား",
  reception: "မင်္ဂလာဧည့်ခံပွဲ",
  dinnerDancing: "ညစာနှင့် အကအစီအစဉ်",
  timeTba: "အချိန်ကို ထပ်မံအသိပေးပါမည်",
  detailsSoon: "မင်္ဂလာပွဲ အသေးစိတ်ကို<br>မကြာမီ အသိပေးပါမည်",
  venueLabel: "မင်္ဂလာပွဲ<br>ကျင်းပမည့်နေရာ",
  venueEyebrow: "ကျင်းပမည့်နေရာ",
  venueTitle: "ကျွန်ုပ်တို့၏ မင်္ဂလာပွဲနေရာ",
  venueCopy: "တည်နေရာနှင့် လမ်းညွှန်ကို ကြည့်ရှုရန်<br>အောက်ပါ Google Maps လင့်ခ်ကို နှိပ်ပါ။",
  openMaps: "Google Maps တွင် ကြည့်ရန်",
  countdownEyebrow: "နေ့ရက်များကို ရေတွက်ရင်း",
  countdownTitle: "ကျွန်ုပ်တို့၏ မင်္ဂလာနေ့အထိ",
  days: "ရက်",
  hours: "နာရီ",
  minutes: "မိနစ်",
  seconds: "စက္ကန့်",
  rsvpEyebrow: "အကြောင်းပြန်ပေးပါရန်",
  rsvpTitle: "ကျွန်ုပ်တို့နှင့်အတူ ဆင်နွှဲမည်လား",
  rsvpCopy: "မင်္ဂလာပွဲသို့ တက်ရောက်နိုင်ခြင်း ရှိ၊ မရှိကို RSVP ဖောင်မှတစ်ဆင့် အကြောင်းပြန်ပေးပါရန် မေတ္တာရပ်ခံအပ်ပါသည်။",
  rsvpButton: "တက်ရောက်မှု အကြောင်းပြန်ရန်",
  rsvpNote: "၂၀၂၆ ခုနှစ်၊ စက်တင်ဘာလ ၃၀ ရက် နောက်ဆုံးထား၍ အကြောင်းပြန်ပေးပါရန်",
  footerDate: "၂၀၂၆ ခုနှစ်၊ နိုဝင်ဘာလ ၈ ရက်",
  openingEyebrow: "ဖိတ်စာလေးတစ်စောင်၊ တစ်သက်တာချစ်ခြင်းမေတ္တာ",
  openingTitle: "လှပသော အခိုက်အတန့်လေးက စောင့်ကြိုနေပါတယ်",
  letterEyebrow: "ကျွန်ုပ်တို့၏ မင်္ဂလာပွဲသို့ ဖိတ်ကြားအပ်ပါသည်",
  openingPrompt: "ချစ်ခြင်းမေတ္တာဖြင့် သင့်အတွက် ပေးပို့ထားပါသည်",
  openInvitation: "မင်္ဂလာဖိတ်စာကို ဖွင့်ရန်",
  scrollExplore: "မင်္ဂလာပွဲအစီအစဉ်ကို ကြည့်ရန် အောက်သို့ ဆွဲပါ",
  replay: "ဖိတ်စာအိတ်ကို ပြန်ဖွင့်ရန်",
  pauseMotion: "လှုပ်ရှားမှု ရပ်ရန်",
  resumeMotion: "လှုပ်ရှားမှု ပြန်စရန်",
  playSound: "တေးဂီတ ဖွင့်ရန်",
  muteSound: "တေးဂီတ ပိတ်ရန်",
};

function photoText(value, language) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[language] || value.en || "";
}

function updateWeddingPhotoLanguage(language = document.documentElement.lang) {
  const moments = window.WEDDING_PHOTOS?.moments || [];
  document.querySelectorAll(".photo-frame").forEach((figure) => {
    const moment = moments[Number(figure.dataset.photoIndex)];
    if (!moment) return;
    figure.querySelector("img").alt = photoText(moment.alt, language);
    const caption = figure.querySelector("figcaption");
    const copy = photoText(moment.caption, language);
    caption.textContent = copy;
    caption.hidden = !copy;
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
  const grid = section?.querySelector(".photo-story__grid");
  const configuration = window.WEDDING_PHOTOS;
  const moments = configuration?.enabled && Array.isArray(configuration.moments)
    ? configuration.moments.filter(moment => moment?.src)
    : [];
  if (!section || !grid || !moments.length) return;

  moments.slice(0, 5).forEach((moment, index) => {
    const figure = document.createElement("figure");
    figure.className = `photo-frame${index === 0 ? " photo-frame--feature" : ""}`;
    figure.dataset.photoIndex = String(configuration.moments.indexOf(moment));
    const image = document.createElement("img");
    image.src = moment.src;
    image.loading = "lazy";
    image.decoding = "async";
    image.style.objectPosition = moment.focus || "50% 50%";
    const caption = document.createElement("figcaption");
    figure.append(image, caption);
    grid.append(figure);
    image.addEventListener("error", () => {
      figure.remove();
      if (!grid.children.length) section.hidden = true;
    });
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

  for (const [unit, value] of Object.entries(values)) {
    const nextValue = String(value).padStart(2, "0");
    const element = units[unit];
    if (element.textContent === nextValue) continue;
    element.textContent = nextValue;
    const bounds = element.getBoundingClientRect();
    if (!motionPaused && !document.hidden && bounds.top < window.innerHeight && bounds.bottom > 0 && invitationIntro.hidden) {
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
  const guestDetails = form.querySelector(".rsvp-guest-details");
  const guestCount = form.elements.namedItem("entry.1498135098");
  const plusOne = form.elements.namedItem("entry.1424661284");
  const acceptanceValue = "Joyfully accepts / ยินดีเข้าร่วมงาน";
  const declineValue = "Regretfully declines / ขออภัย ไม่สามารถเข้าร่วมงานได้";
  form.dataset.rsvpStartedAt = String(Date.now());

  form.querySelectorAll('input[name="entry.877086558"]').forEach(choice => {
    choice.addEventListener("change", () => {
      const attending = choice.value === acceptanceValue;
      guestDetails.hidden = !attending;
      plusOne.disabled = !attending;
      if (attending && (!guestCount.value || guestCount.value === "0")) guestCount.value = "1";
      if (!attending) guestCount.value = "0";
    });
  });

  form.addEventListener("submit", async event => {
    if (!("fetch" in window)) return;
    event.preventDefault();
    if (!form.reportValidity()) return;
    const copy = translations[document.documentElement.lang] || translations.en;
    submit.disabled = true;
    form.classList.add("is-submitting");
    status.textContent = copy.sendingRsvp;
    const responseName = form.elements.namedItem("entry.1459528256").value.trim();
    try {
      const apiUrl = typeof window.RSVP_API_URL === "string" ? window.RSVP_API_URL.trim() : "";
      if (!apiUrl) throw new Error("RSVP service is not configured.");
      const formData = new FormData(form);
      const attendanceValue = formData.get("entry.877086558");
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: responseName,
          attendance: attendanceValue === acceptanceValue ? "accept" : attendanceValue === declineValue ? "decline" : "",
          partySize: formData.get("entry.1498135098"),
          plusOne: formData.get("entry.1424661284") || "",
          dietary: formData.get("entry.649557088") || "",
          language: document.documentElement.lang || "en",
          website: formData.get("website") || "",
          startedAt: Number(form.dataset.rsvpStartedAt)
        })
      });
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
    guestDetails.hidden = false;
    plusOne.disabled = false;
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


