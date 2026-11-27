# 82Rentals – cinematic-etusivu

- Uusi, erillinen projekti (ei liity car-detailing-sivuihin).
- Staattinen sivu: `index.html`, `styles.css`, `main.js`, `i18n.js` (FI/EN-tekstit).
  Kirjastot (GSAP, ScrollTrigger, Lenis) ovat `vendor/`-kansiossa ja fontit `fonts/`-kansiossa — ei build-vaihetta.
- Tekstit ovat sana sanalta nykyiseltä 82rentals.com-sivustolta (etusivu + /vesijettimme, /hinnasto, /meista, /ukk, /yhteystiedot, /varaa). Älä muuta niitä ilman pyyntöä äläkä keksi hintoja, arvosteluja tai väitteitä.
- Yläpalkin linkit vievät sivun omiin osioihin (#jet, #hinnasto, #team, #ukk, #yhteystiedot). Varauslinkit ja footerin alasivulinkit osoittavat nykyiseen 82rentals.com-sivustoon (varausjärjestelmä on siellä).
- Laitteisto-osio (#jet) on kiinnitetty näkymä: oma SVG-kuvitus piirtyy, saa värit ja kamera kiertää osat 01–04 (main.js, `focus`-taulukko vastaa SVG:n kohdepisteitä).
- Julkaisu: push `main`-haaraan → Vercel julkaisee automaattisesti. Käyttäjä haluaa muutokset suoraan livenä.
- Hero-video: `media/hero.mp4` (1080p) ja `media/hero-720.mp4` (mobiili), Higgsfield Seedance 2.0, ei ääntä. Toistetaan kerran ja jäädään viimeiseen ruutuun.
- Higgsfield-generoinneista kerrotaan aina kredit-arvio ja odotetaan käyttäjän vahvistusta.
