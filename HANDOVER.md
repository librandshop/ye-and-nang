# Ye & Nang wedding invitation — handover

## Current invitation

- Couple: Ye Moe Myint (Ye) and Nang Htet Htet Aung (Nang)
- Wedding: Sunday, 8 November 2026
- Live site: https://librandshop.github.io/ye-and-nang/
- Thai preview: https://librandshop.github.io/ye-and-nang/?lang=th
- Burmese preview: https://librandshop.github.io/ye-and-nang/?lang=my
- Repository: https://github.com/librandshop/ye-and-nang
- RSVP deadline: 30 September 2026
- Venue map: https://maps.app.goo.gl/vTDBF3szrC5VXmnKA

## Site status

The invitation is a static GitHub Pages site presented as an animated editorial wedding suite. Guests open an enchanted floral envelope, then move through one continuous pink-and-ivory invitation with one photograph per editorial scene, a keepsake date seal, numbered program, destination vignette, wine-colored countdown interlude and formal reply card. It supports English, Thai and Burmese, remembers the chosen language, honors reduced-motion preferences and provides sound and motion controls.

Six optimized photographs from `assets/photos/` form a cinematic story across the invitation. Each photograph has its own section: the full-screen opening, road portrait, graduation portrait, bouquet portrait sourced from `455A2717.jpg`, red studio portrait and closing portrait before RSVP. Captions and alternative text are localized. `PHOTO-GUIDE.md` records the originals, crop focus and social-sharing image.

The post-countdown closing portrait is sourced from enhanced `photos/9.jpg` and preserves its full 2:3 gown composition. Countdown numerals use deep wine ink inside pearl medallions for accessible contrast.

All six live photographs were refreshed from the enhanced masters in `photos/`: `3.jpg`, `1.jpg`, `5.jpg`, `10.jpg`, `9.jpg` and `15.jpg`. The optimized invitation copies retain the existing scene filenames, and the social-sharing image was rebuilt from enhanced `3.jpg`.

The envelope exterior uses `assets/pink-envelope-bloom-garden.webp`: an asymmetrical pink-flower-only arrangement with no green foliage. The red studio chapter uses `455A2626.jpg`, where both people are standing.

The invitation includes an all-day calendar event for Google Calendar, Apple Calendar and Outlook; the supplied Google Maps destination; a countdown; and a custom RSVP card. The confirmed program is Welcome Reception at 3:00 PM, Betrothal Ceremony at 3:30 PM, Paying Respects Ceremony at 5:00 PM, Water Pouring Ceremony at 5:30 PM and Wedding Celebration at 6:30 PM.

## RSVP architecture

The public Google Form is archived and no longer receives invitation submissions. The custom form posts to `https://ye-and-nang-rsvp.librandshop.workers.dev`. The Cloudflare Worker validates the request and creates an issue in the private `librandshop/ye-and-nang-rsvp` repository. Transfer slips are validated as JPG, PNG or WebP and stored in the `ye-and-nang-rsvp-slips` R2 bucket.

Guests may accept for themselves and one plus-one, or decline. Declining guests can optionally view the public payment details, leave a message and attach a transfer slip. The GitHub token must remain only in the Worker's encrypted `GITHUB_TOKEN` secret.

## Important files

| File | Purpose |
| --- | --- |
| `index.html` | Envelope, invitation content, RSVP form and social metadata. |
| `styles.css` | Base layout and envelope choreography. |
| `letter.css` | Love-letter styling, photo chapter, RSVP and motion refinement. |
| `script.js` | Languages, animation, music, photos, countdown and RSVP behavior. |
| `photo-config.js` | Enabled photographs, crop focus, captions and alt text. |
| `PHOTO-GUIDE.md` | Photo source and optimization record. |
| `rsvp-config.js` | Public Cloudflare Worker endpoint. |
| `rsvp-worker/` | Worker source, tests and deployment configuration. |
| `AUDIO-CREDITS.md` | Music and sound-effect sources and licenses. |
| `ye-nang-wedding.ics` | Apple Calendar and Outlook event. |

## Remaining checks

1. Test the complete opening, music, calendars, RSVP and slip upload on actual iPhone and Android devices.
2. Monitor the private RSVP repository and Cloudflare Worker/R2 usage. The public Worker uses validation and a honeypot but currently has no Turnstile or rate limiting.
3. Remember that payment numbers and the PromptPay QR image are intentionally public on the invitation.

Publish from the `main` branch of `librandshop/ye-and-nang`. GitHub Pages deploys new commits automatically. The `.preview` folder contains local review artifacts and is not part of the public invitation.

