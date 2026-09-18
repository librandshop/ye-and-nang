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

The invitation is a static GitHub Pages site presented as an animated love letter. Guests open an enchanted floral envelope, then read one continuous pink-and-ivory invitation. It supports English, Thai and Burmese, remembers the chosen language, honors reduced-motion preferences and provides sound and motion controls.

The enabled photo chapter displays five optimized photographs from `assets/photos/`, with localized captions and alternative text. `PHOTO-GUIDE.md` records the originals, crop focus and social-sharing image.

The invitation includes an all-day calendar event for Google Calendar, Apple Calendar and Outlook; the supplied Google Maps destination; a countdown; and a custom RSVP card. Ceremony, reception and dinner times remain explicitly unconfirmed.

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

1. Replace “time to be announced” when the wedding schedule is confirmed.
2. Test the complete opening, music, calendars, RSVP and slip upload on actual iPhone and Android devices.
3. Monitor the private RSVP repository and Cloudflare Worker/R2 usage. The public Worker uses validation and a honeypot but currently has no Turnstile or rate limiting.
4. Remember that payment numbers and the PromptPay QR image are intentionally public on the invitation.

Publish from the `main` branch of `librandshop/ye-and-nang`. GitHub Pages deploys new commits automatically. The `.preview` folder contains local review artifacts and is not part of the public invitation.

