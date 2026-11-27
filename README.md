# Texas Youth Brain Health Council — website

The public website for the Texas Youth Brain Health Council (TYBHC), a youth-led council turning brain science into better schools, healthier habits, and a stronger youth voice across Texas.

It's a plain static site: HTML, CSS, and JavaScript, with no build step and no frameworks. Open `index.html` in a browser to preview it.

## What's in here

```
index.html                 the whole home page
404.html                   "page not found" page
assets/css/styles.css      colors, fonts, layout, responsive rules
assets/js/neural-field.js  the hero animation (a live neural network)
assets/js/main.js          menu, scroll effects, small helpers
assets/favicon.svg         browser tab icon (the brain logo on a navy tile)
assets/img/logo-mark.svg   the TYBHC brain logo, used in the header and footer
assets/img/social-preview.png  image shown when the link is shared (1200×630)
assets/img/logo-square.png     square logo with name, for social media profiles (1080×1080)
.nojekyll                  tells GitHub Pages to serve files as-is
```

## The hero animation

The moving network at the top of the page is a small simulation of **leaky integrate-and-fire neurons**:

- every dot has a membrane potential that slowly leaks toward rest,
- it gets small random input, plus extra input wherever your cursor is,
- when it crosses threshold it spikes, resets, rests for a moment, and sends a pulse down each of its connections,
- when a pulse arrives, the receiving neuron's potential jumps, sometimes setting off a chain reaction.

Click or tap anywhere in the hero to set off a burst. All model settings (leak, threshold, synapse weight, refractory period) are constants at the top of `assets/js/neural-field.js` and are fun to experiment with.

The animation pauses when it's off screen and is replaced by a still image for visitors who have "reduce motion" turned on.

## Design

**Palette: matched to the brain logo**

| Name | Hex | Used for |
|---|---|---|
| Logo navy | `#0B1430` | dark sections |
| Mist | `#EFF2FA` | light sections |
| Ink | `#141C33` | body text on light |
| Sky blue | `#4FC3F7` | buttons, neurons firing on the left |
| Logo blue | `#3A5BEA` / `#2F55D8` | left hemisphere, blue text on light |
| Logo pink | `#F0386F` | right hemisphere, sparks |
| Logo purple | `#B57CF0` | right hemisphere, connections |

The blue-to-pink "brand gradient" (`--brand-gradient` in `styles.css`) is used for accent lines, the founding-year pathway, and the vision headline.

**Logo colors:** the brain logo keeps its own gradients, blue `#3A5BEA` → `#4FC3F7` on the left hemisphere and pink `#F0386F` → purple `#B57CF0` on the right. It is drawn once in `assets/img/logo-mark.svg` (the right half is a mirror of the left), so editing that one file updates every place it appears.

**Fonts** (from Google Fonts):
- *Bricolage Grotesque* for headings
- *Atkinson Hyperlegible* for body text, designed by the Braille Institute to be easy to read for everyone

## Editing content

All text lives in `index.html`, one clearly commented `<section>` per part of the page. To change wording, edit the text between the tags and save.

**Before launch, update:**
- [ ] The contact email. Search `index.html` for `hello@tybhc.org` and replace it with the council's real address.
- [ ] The Team section. Add other co-founders' first names and roles (first names only, no photos, for student privacy).
- [ ] Optional: add a sign-up form link (e.g. a Google Form) to the "Get involved" section.

## Going live on tybhc.org (later)

1. Make this repository **public** (Settings → General → Danger Zone → Change visibility). Free GitHub Pages hosting needs a public repo.
2. Settings → Pages → *Build and deployment* → Source: **Deploy from a branch**, Branch: **main**, folder **/ (root)** → Save.
3. In the same Pages screen, enter `tybhc.org` as the **Custom domain** and save. GitHub adds a `CNAME` file automatically.
4. At the domain registrar, add the DNS records from GitHub's guide ("Managing a custom domain for your GitHub Pages site"): four `A` records for `@` and a `CNAME` for `www` pointing to `<username>.github.io`. **Don't touch the existing MX/TXT records**, since they run the council's Google Workspace email.
5. Once the domain check passes, tick **Enforce HTTPS**.
