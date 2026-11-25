# 82Rentals – cinematic-etusivu

- Uusi, erillinen projekti (ei liity car-detailing-sivuihin).
- Staattinen sivu: `index.html`, `styles.css`, `main.js`, `i18n.js` (FI/EN-tekstit).
  Kirjastot (GSAP, ScrollTrigger, Lenis) ovat `vendor/`-kansiossa ja fontit `fonts/`-kansiossa — ei build-vaihetta.
- Tekstit ovat sana sanalta nykyiseltä 82rentals.com-etusivulta. Älä muuta niitä ilman pyyntöä.
- Varaus- ja alasivulinkit osoittavat nykyiseen 82rentals.com-sivustoon (varausjärjestelmä on siellä).
- Julkaisu: push `main`-haaraan → Vercel julkaisee automaattisesti. Käyttäjä haluaa muutokset suoraan livenä.
- Hero-video: `media/hero.mp4` (1080p) ja `media/hero-720.mp4` (mobiili), Higgsfield Seedance 2.0, ei ääntä. Toistetaan kerran ja jäädään viimeiseen ruutuun.
- Higgsfield-generoinneista kerrotaan aina kredit-arvio ja odotetaan käyttäjän vahvistusta.
