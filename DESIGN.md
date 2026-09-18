# A personal wedding letter

White and floral-pink stationery with oversized, asymmetric italic name lettering. Small jasmine and blush sweet-pea vines weave around the Y and the end of Nang; fine animated stems pass behind and in front of the letters. There are no large standalone bouquets. Full names remain beneath the centerpiece, and Y & N remains the seal monogram.

English, Thai and Burmese are preserved, with synchronized cover and main-page selectors, saved language preference and `?lang=en`, `?lang=th`, `?lang=my` links. Wedding details, RSVP, calendar and map destinations are unchanged.

## One physical invitation

The same card is nested between the envelope back and front pocket. The former duplicate printed placeholder has been removed. The closed gatefold is opaque and its inside copy stays hidden throughout extraction.

- 0–1.1 seconds: release the wax seal and ribbon; unfold the envelope flap.
- 1.1–2.95 seconds: slide the closed card above the pocket, then rotate it upright and center it. The envelope drops away before the rotation finishes.
- 2.95–3.55 seconds: release the paper band. The left fold starts at 3.4 seconds, the right at 3.55 seconds. Only then is the inside printing exposed.
- 3.55–5.9 seconds: the panels unfold around the printed invitation, followed by a short reading pause.
- 5.9–6.6 seconds: the letter and cover dissolve into the main invitation.

Geometry is measured from the actual envelope and untransformed card dimensions for mobile, landscape and replay. A localized skip control, Escape, reduced motion and pausing can finish immediately. Focus is contained in the cover while open and moves to the main names afterward. JavaScript-disabled visitors see the complete invitation immediately.

## Main-page motion and layout

- Ye and Nang inscribe separately; the ampersand settles between them; fine stems trace around the names and small flowering vines grow into place, then gently sway.
- The main page is one continuous white, fine-bordered letter on blush paper. A small code-native satin bow crowns the arched stationery; a matching bow introduces the reply. The envelope markup and opening functions are unchanged.
- A personal salutation and signed note precede the calendar actions. English copy uses softer serif typography, with appropriate Thai and Burmese font shaping and line heights.
- Ceremony, reception and dinner form a centered wedding program, without business-style numbering, cards or timeline. Unconfirmed times and the shared details notice remain explicit.
- Venue directions are a simple centered invitation detail; the decorative route graphic has been removed. Both calendar buttons and the Maps button retain their prominent themed design and original destinations.
- The countdown is printed directly on the paper, without dashboard tiles. The RSVP closes the letter rather than repeating a call to action in the hero.
- Slow ink fades, drawn ornamental dividers, a revealing signature and gentle ribbon movement replace presentation-style card tilts. `letter.css` scopes the redesign to the main invitation without changing envelope styles.
- The opening uses recorded physical paper, sliding, lifting and unfolding sounds synchronized to the envelope choreography. The invitation then crossfades into a full recorded wedding track selected by the active language, with a persistent mute control.
- Flower motion is articulated: roots remain planted while middle stems and blossom tips bend by different amounts, creating a stronger but still natural breeze.

## Heirloom refinement

- The invitation is presented as a finely bordered arched sheet on a layered blush background, with subtle paper grain and soft depth rather than rectangular website sections.
- A small double-line oval holds the date like a printed keepsake, while the guest message gains a restrained quotation mark and balanced typesetting.
- Tiny jasmine vines grow from selected paper margins only. They remain secondary to the names and never become central bouquets.
- The wedding program alternates gently from side to side like a handwritten order of events. The icons and ornamental dividers draw themselves as guests reach them.
- Countdown values are connected by one fine rule and delicate dots, and the venue and RSVP use soft ceremonial arches instead of dashboard cards.
- A vertical progress thread runs along the edge of the stationery and ends in a small star, making scrolling feel like following a ribbon through the letter.
- The entire paper arrives softly after the envelope closes; the date keepsake, margin vines, program entries and final reply then reveal in their own restrained sequence.
- Motion can be paused; system reduced-motion preferences are honored by default. There is no automatic music.

## Artwork

Asset: `assets/jasmine-vine.webp`, 667 × 1000, transparent WebP, 64,118 bytes. Created with the built-in image-generation tool, then resized and encoded while preserving alpha. Earlier bouquet assets remain on disk but are no longer used in the invitation artwork.

Final generation prompt:

> Use case: photorealistic-natural. Asset type: genuinely transparent botanical cutout for weaving around the letters of a wedding couple's names in a modern editorial website. Primary request: one very slender, airy trailing flowering vine, an elegant loose S curve hanging vertically. Fine fresh sage-green jasmine stems, tiny sparse heart-shaped leaves, six very small white jasmine blossoms and three tiny pale blush pink sweet pea flowers, a few buds. Each flower is small compared with the long fine stem, no large focal bloom, no bouquet or cluster. Real delicate silky petals, luminous soft daylight, natural subtle shadows only on petals. Composition: portrait 1024x1536, one single strand, gently curving from upper left to mid-right then trailing to lower left, fully within canvas with margin, lots of transparent space around and between the tiny leaves and blossoms. This is a typographic embellishment, not a standalone centerpiece. Clean contemporary florist photography, actual alpha transparent background. No text, letters, vase, paper, vintage watercolor, big roses, dense foliage, garland frame, border, drop shadow, watermark or other props.

## Verification

Chrome checks at 1440 × 1000, 390 × 844, 320 × 640 and 844 × 390 cover the full opening, centered card geometry, content bounds, all scroll reveals, horizontal overflow, replay, skip, Escape, reduced motion, pausing mid-opening and no-JavaScript fallback. A separate deterministic timeline test checks 900, 1700, 2800 and 3300 milliseconds: inside words remain hidden and both panels remain closed. At 5100 milliseconds the printing is visible and the card is centered. Screenshots were reviewed on desktop and phones, including Burmese and Thai.

## Custom RSVP experience

The generic Google Form page is no longer part of the guest journey. A custom reply card now lives inside the invitation and inherits its fine pink rules, serif typography, pill-shaped attendance choices and restrained heart details. It adapts after the guest accepts or declines, presents a localized confirmation in place, and allows another household response without leaving the letter.

Responses continue to use the existing Google Form as their private collection backend. The live form's five exact entry fields are preserved: guest name, attendance, party size, plus-one name and dietary requirements. The interface and confirmation copy are fully translated in English, Thai and Burmese. Native browser validation, keyboard focus, an accessible live status and a no-JavaScript Google Form fallback are retained.

Automated checks intercept the submission before it reaches Google, then verify the exact encoded field names and values, attendance-dependent controls, translated placeholders, reset flow, confirmation positioning and layout at desktop, phone and 320-pixel widths. No test response is added to the couple's response sheet.

## Photo story

The invitation now unfolds as a cinematic photo story rather than containing one isolated gallery. Immediately after the envelope, the intimate principal portrait becomes a full-viewport opening scene with title, date and an integrated music control. The typographic invitation follows as a quieter stationery scene. Three middle memories then appear as deliberately different chapters: an arched outdoor print, a circular graduation keepsake and a wide red portrait in which both the bride and groom are standing. The bright formal portrait returns near the RSVP as the emotional closing scene.

The five photographs remain configuration-driven in `photo-config.js`, with independent crop focus plus English, Thai and Burmese alternative text and captions. Images use lazy loading and asynchronous decoding where appropriate, and a missing asset safely removes its scene. On phones, the story retains its varied shapes and pacing without horizontal overflow. The envelope, pink floral identity, RSVP, calendar actions and accessibility controls remain intact.

`PHOTO-GUIDE.md` records source-quality, naming, crop and social-preview requirements. The QR sharing artwork keeps a protected lower QR region and can later receive a dedicated vertical portrait without rebuilding its composition. Its real QR code must always be revalidated after final compositing and compression.

## Pink envelope garden

The closed envelope now uses `assets/pink-envelope-bloom-garden.webp`, a transparent 1200 × 800 WebP floral composition. It is one continuous asymmetrical sweep of pink peonies, ranunculus, sweet peas, cherry blossoms and small florets, rising on the left and trailing lightly to the right. The open center protects the seal and monogram. There are no green leaves or green foliage.

Generation prompt summary: an organic, asymmetrical pink flower meadow for a luxury wedding envelope; many pink blossoms only, one continuous bottom sweep, tall on the left and sparse on the right, transparent background, open seal area, no mirrored bouquets, no paired mounds, no greenery, no white or yellow flowers, no text and no envelope.

## Romantic editorial refinement

- Additional blush sweet-pea and white jasmine sprigs now grow from the paper margins around the hero, personal note, calendar keepsake, wedding program, venue, countdown and reply. They remain behind the content and are deliberately asymmetric rather than forming large central bouquets.
- The program is three centered ceremonial moments with fine round icon medallions. Alternating business-like rows and horizontal connector rules have been removed at every viewport size.
- Countdown values sit in four softly double-lined keepsake medallions. The former continuous rule and punctuation dots are gone, eliminating mobile alignment drift while preserving the single-row rhythm.
- The reply form receives a lightly printed inner sheet, stronger selected attendance states and more tactile button depth. Its Google Forms backend and exact response mapping are unchanged.
- Mobile vertical spacing is tightened across the hero, program, venue, countdown and reply. Flowers scale down and retreat toward the paper edge at narrow widths.
- New flowers unfurl as their section enters view and then move only through a very slow six-pixel sway. Paused and reduced-motion experiences display them statically.

New asset: `assets/blush-flower-sprig.webp`, 667 × 1000, transparent WebP, 99,254 bytes. Generated with the built-in image-generation tool, then resized and encoded with its alpha channel preserved.

Generation prompt summary: one airy contemporary flowering sprig on genuine transparency, with a slender sage stem, pale blush sweet peas, tiny white jasmine flowers and unopened buds; natural florist photography, soft daylight, open spacing, no bouquet, no large roses, no vase, no text and no background.

## Cinematic love-letter finish

- A fine flowering thread now runs down the stationery beneath the content, with alternating leaf-shaped nodes. It grows only after the envelope has finished and visually connects the invitation from the hero to the reply.
- Section endings use a small star-and-rule ornament, so the page reads as one continuous printed letter instead of a stack of unrelated panels.
- The paper receives a very subtle moving highlight tied to reading progress. This changes only the perceived light across the ivory sheet; content geometry never moves.
- Language and motion controls become quieter after the guest starts scrolling, then return to full size and opacity on hover or keyboard focus.
- English, Thai and Burmese receive independent balanced wrapping and line-width limits for the personal message, venue and reply copy.
- The venue is now an inset arched destination vignette with double letterpress lines, a soft top glow and controlled Maps button width.
- Successful replies store the submitted display name only in page memory and render a localized `Thank you, {name}` message. Two restrained floral sprigs bloom around the confirmation. No guest name is added to the URL, storage or page source.
- Reduced-motion and paused states preserve the complete composition without growing vines, changing highlights or floral entrance animations.

## Luxury-impact reveal

- The envelope now sits inside a restrained champagne halo with small metallic glints and deeper rose shadows. Fine embossed lines, satin highlights and a more dimensional wax seal give the cover the tactile weight of luxury stationery.
- Opening is staged in distinct emotional beats: the surrounding light quiets, the seal and ribbon release, the closed keepsake rises, its folds open, a warm halo blooms behind it, and two translucent blush curtains part into the main invitation.
- The paper arrives through a soft luminous aperture rather than simply appearing. The hero arch gains layered ivory depth, champagne rules and a blush aura focused behind the couple's names.
- `Ye & Nang` carries the strongest contrast on the page. Its ink, ampersand, floral vines and date keepsake now form one deliberate focal composition, with richer shadows and subtle metallic accents.
- Main-page section reveals use softer focus, masked upward movement and changing light instead of card-like motion. Floral margins and ornamental rules remain secondary and asymmetrical.
- Phone layouts preserve the full opening choreography with smaller halos, safer edge spacing and compact typography. Paused and reduced-motion modes show the finished luxury composition without transitional effects.

## Refined pearl finish

- The envelope palette is pearl ivory, warm stone, muted rose and champagne rather than saturated pink.
- The envelope outline leaves with the pocket during opening, so no rectangular frame remains around the unfolded letter.
- Mobile hero framing is reduced to one clean inner arch and the paper edge; circular accent lines no longer cross headings, names or the date card.

## Modern envelope system

- The cover now uses the main invitation's ivory, pale blush, champagne and wine palette without glossy pink bevels.
- A thin translucent belly band, small pressed monogram seal, fine date imprint and single jasmine corner replace the oversized ribbon-and-wax treatment. The folded inner card uses the same narrow band and single-line letterpress framing.
- The ambient effect is a soft field of paper light rather than concentric rings. The seal lifts and the band parts horizontally for a cleaner editorial opening gesture.
- These changes are limited to the cover envelope; the approved main invitation composition is unchanged.

## Editorial wedding suite

- The invitation now unfolds as a sequence of designed keepsakes rather than similarly styled stacked sections. Large chapter numbers, fine letterpress rules and alternating ivory/blush fields create a clear visual journey from the personal note to the formal reply.
- The photo story uses an offset magazine composition on wide screens: the arched road portrait and circular graduation keepsake overlap as one spread, followed by a full-width red studio portrait. Phones preserve the varied silhouettes in a clean single-column sequence.
- Calendar actions sit beside a circular `08 / 11 / 2026` date seal, making the section read like a save-the-date card rather than a utility toolbar.
- The order of events is a numbered editorial timeline inside a double-lined ceremonial arch. Its staggered two-column desktop rhythm becomes one readable vertical thread on phones.
- Venue information is presented as a destination card with a stylized blush map field and a custom date-pin emblem. The Maps destination and accessible action remain unchanged.
- The countdown is a dramatic wine-colored interlude with pearl-white time medallions, providing a deliberate visual crescendo between logistics and the closing portrait.
- RSVP is framed as the final formal reply card, with a date stamp, satin bow, nested paper panel and the existing localized submission experience intact.
- `455A2717.jpg` appears as a dedicated full-height portrait chapter between the program and venue. Its original 2:3 composition is preserved inside an arched print, paired with an offset caption card on desktop and a centered overlapping caption on phones.
- Desktop at 1200 pixels and phone at 500 pixels were visually reviewed with zero horizontal overflow. English, Thai and Burmese were verified with all three timeline steps and both date seals present, and no undefined translation output.

## Enchanted-garden envelope

- The opening cover now feels like a romantic fairytale garden: blush and ivory flowers, sage climbing vines and warm firefly-like light form a living doorway around the seal.
- The floral frame is original transparent artwork generated for this invitation, not a character or scene copied from an existing film or franchise.
- The artwork gently breathes before opening and brightens as the envelope releases, while the approved extraction and unfolding choreography remains unchanged.
- New optimized asset: `assets/enchanted-envelope-garden.webp`, 1200 × 800, transparent WebP, approximately 368 KB.

## Pink-blossom layer

- The approved main invitation gains additional small climbing accents made exclusively from pale blush, petal pink and dusty-rose flowers; no white, cream, purple, blue or red blossoms are present in the new artwork.
- Eight asymmetric placements enrich the hero, personal note, calendar area, program, venue, countdown and RSVP while remaining behind all text and controls. The hero receives a balanced high-right and low-left pair.
- The vines unfurl with their section and then move through a restrained slow sway. Mobile versions retreat toward the paper edges and reduced-motion mode keeps them static.
- New optimized asset: `assets/pink-blossom-vine.webp`, 733 × 1100, transparent WebP.

## Wind garden motion

- Six additional small pink vines fill previously quiet lower corners, bringing the main invitation to fourteen pink-blossom placements without changing content geometry.
- Every botanical family now participates in the breeze: enchanted envelope florals, folded-card vines, hero name sprigs, pink vines, blush sprigs, jasmine margin vines and the continuous letter vine.
- Motion is layered rather than synchronized. Stems bend in alternating directions and durations while their parent arrangements drift more slowly, producing a natural wind effect instead of identical looping movement.
- Pause-motion and operating-system reduced-motion preferences stop every new wind animation.

## Natural articulated breeze

- Large floral cutouts no longer translate as one rectangular image. Each is rendered as a planted lower stem, a gently bending middle section and a more responsive flower-heavy tip.
- The envelope garden is split into independently moving left and right banks, each anchored at its own lower corner.
- The monogram seal is enlarged to 70 pixels on desktop and 60 pixels on phones so it remains the visual focal point inside the fuller garden.

## Recorded soundtrack

- English uses “Wedding Harp” by Francisco Alvear, Thai uses “Possible Dreams” by Eugenio Mininni, and Burmese uses “Love is Eternal” by Ahjay Stelino.
- Music and paper recordings stream from Mixkit's audio CDN under the Mixkit Stock Music Free License and Mixkit Sound Effects Free License. See `AUDIO-CREDITS.md`.


