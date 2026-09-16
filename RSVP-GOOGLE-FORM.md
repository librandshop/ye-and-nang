# Archived RSVP Google Form backend

> Archived on 16 September 2026. The invitation no longer submits to Google Forms. Responses now pass through the Cloudflare Worker documented in `RSVP-SECURE-SETUP.md` and become private issues in `librandshop/ye-and-nang-rsvp`. The notes below remain only as historical reference.

The setup notes below are retained as the original form brief and may not exactly match the current five-field live form.

# Original bilingual form brief | EN / TH

Create the form at [forms.google.com](https://forms.google.com). Use every English / Thai pair below in the same question so all guests can complete one form.

## Form details

- Title: `Ye & Nang | Wedding RSVP / &#x0e41;&#x0e1a;&#x0e1a;&#x0e15;&#x0e2d;&#x0e1a;&#x0e23;&#x0e31;&#x0e1a;&#x0e07;&#x0e32;&#x0e19;&#x0e41;&#x0e15;&#x0e48;&#x0e07;&#x0e07;&#x0e32;&#x0e19;&#x0e02;&#x0e2d;&#x0e07; Ye & Nang`
- Description: `We are so happy to celebrate with you on November 8, 2026. Please reply by [add your RSVP deadline]. / &#x0e40;&#x0e23;&#x0e32;&#x0e22;&#x0e34;&#x0e19;&#x0e14;&#x0e35;&#x0e40;&#x0e1b;&#x0e47;&#x0e19;&#x0e2d;&#x0e22;&#x0e48;&#x0e32;&#x0e07;&#x0e22;&#x0e34;&#x0e48;&#x0e07;&#x0e17;&#x0e35;&#x0e48;&#x0e08;&#x0e30;&#x0e44;&#x0e14;&#x0e49;&#x0e40;&#x0e09;&#x0e25;&#x0e34;&#x0e21;&#x0e09;&#x0e25;&#x0e2d;&#x0e07;&#x0e01;&#x0e31;&#x0e1a;&#x0e04;&#x0e38;&#x0e13;&#x0e43;&#x0e19;&#x0e27;&#x0e31;&#x0e19;&#x0e17;&#x0e35;&#x0e48; 8 &#x0e1e;&#x0e24;&#x0e28;&#x0e08;&#x0e34;&#x0e01;&#x0e32;&#x0e22;&#x0e19; &#x0e1e;.&#x0e28;. 2569 &#x0e01;&#x0e23;&#x0e38;&#x0e13;&#x0e32;&#x0e15;&#x0e2d;&#x0e1a;&#x0e23;&#x0e31;&#x0e1a;&#x0e20;&#x0e32;&#x0e22;&#x0e43;&#x0e19; [&#x0e23;&#x0e30;&#x0e1a;&#x0e38;&#x0e27;&#x0e31;&#x0e19;&#x0e15;&#x0e2d;&#x0e1a;&#x0e23;&#x0e31;&#x0e1a;]`
- Confirmation message: `Thank you for your RSVP. We can't wait to celebrate with you! / &#x0e02;&#x0e2d;&#x0e1a;&#x0e04;&#x0e38;&#x0e13;&#x0e2a;&#x0e33;&#x0e2b;&#x0e23;&#x0e31;&#x0e1a;&#x0e01;&#x0e32;&#x0e23;&#x0e15;&#x0e2d;&#x0e1a;&#x0e23;&#x0e31;&#x0e1a; &#x0e40;&#x0e23;&#x0e32;&#x0e41;&#x0e17;&#x0e1a;&#x0e23;&#x0e2d;&#x0e44;&#x0e21;&#x0e48;&#x0e44;&#x0e2b;&#x0e27;&#x0e17;&#x0e35;&#x0e48;&#x0e08;&#x0e30;&#x0e44;&#x0e14;&#x0e49;&#x0e23;&#x0e48;&#x0e27;&#x0e21;&#x0e09;&#x0e25;&#x0e2d;&#x0e07;&#x0e01;&#x0e31;&#x0e1a;&#x0e04;&#x0e38;&#x0e13;!`

## Questions

1. `Your full name / &#x0e0a;&#x0e37;&#x0e48;&#x0e2d;-&#x0e19;&#x0e32;&#x0e21;&#x0e2a;&#x0e01;&#x0e38;&#x0e25;&#x0e02;&#x0e2d;&#x0e07;&#x0e04;&#x0e38;&#x0e13;` - Short answer - Required
2. `Will you join us? / &#x0e04;&#x0e38;&#x0e13;&#x0e08;&#x0e30;&#x0e21;&#x0e32;&#x0e23;&#x0e48;&#x0e27;&#x0e21;&#x0e07;&#x0e32;&#x0e19;&#x0e01;&#x0e31;&#x0e1a;&#x0e40;&#x0e23;&#x0e32;&#x0e44;&#x0e2b;&#x0e21;?` - Multiple choice - Required
   - `Joyfully accepts / &#x0e22;&#x0e34;&#x0e19;&#x0e14;&#x0e35;&#x0e40;&#x0e02;&#x0e49;&#x0e32;&#x0e23;&#x0e48;&#x0e27;&#x0e21;&#x0e07;&#x0e32;&#x0e19;`
   - `Regretfully declines / &#x0e02;&#x0e2d;&#x0e2d;&#x0e20;&#x0e31;&#x0e22; &#x0e44;&#x0e21;&#x0e48;&#x0e2a;&#x0e32;&#x0e21;&#x0e32;&#x0e23;&#x0e16;&#x0e40;&#x0e02;&#x0e49;&#x0e32;&#x0e23;&#x0e48;&#x0e27;&#x0e21;&#x0e07;&#x0e32;&#x0e19;&#x0e44;&#x0e14;&#x0e49;`
3. `How many guests from your party will attend? / &#x0e08;&#x0e33;&#x0e19;&#x0e27;&#x0e19;&#x0e1c;&#x0e39;&#x0e49;&#x0e40;&#x0e02;&#x0e49;&#x0e32;&#x0e23;&#x0e48;&#x0e27;&#x0e21;&#x0e08;&#x0e32;&#x0e01;&#x0e01;&#x0e25;&#x0e38;&#x0e48;&#x0e21;&#x0e02;&#x0e2d;&#x0e07;&#x0e04;&#x0e38;&#x0e13;` - Dropdown - Required
   - 0
   - 1
   - 2
   - 3
   - 4
4. `Names of attending guests / &#x0e0a;&#x0e37;&#x0e48;&#x0e2d;&#x0e1c;&#x0e39;&#x0e49;&#x0e40;&#x0e02;&#x0e49;&#x0e32;&#x0e23;&#x0e48;&#x0e27;&#x0e21;&#x0e07;&#x0e32;&#x0e19;` - Paragraph - Optional
5. `Dietary requirements or allergies / &#x0e02;&#x0e49;&#x0e2d;&#x0e08;&#x0e33;&#x0e01;&#x0e31;&#x0e14;&#x0e14;&#x0e49;&#x0e32;&#x0e19;&#x0e2d;&#x0e32;&#x0e2b;&#x0e32;&#x0e23;&#x0e2b;&#x0e23;&#x0e37;&#x0e2d;&#x0e2d;&#x0e32;&#x0e01;&#x0e32;&#x0e23;&#x0e41;&#x0e1e;&#x0e49;` - Paragraph - Optional
6. `A message for Ye & Nang / &#x0e02;&#x0e49;&#x0e2d;&#x0e04;&#x0e27;&#x0e32;&#x0e21;&#x0e16;&#x0e36;&#x0e07; Ye & Nang` - Paragraph - Optional

## Before sharing

1. In the form settings, make sure guests outside your Google account or organization can respond.
2. Publish the form and copy its responder link, not the editor link.
3. Optionally link the Responses tab to a Google Sheet so all answers are collected in one place.
4. Send the responder link to the site editor to activate the RSVP button.

