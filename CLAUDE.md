# 82Rentals – cinematic-etusivu

- Uusi, erillinen projekti (ei liity car-detailing-sivuihin).
- Staattinen sivu: `index.html`, `styles.css`, `main.js`, `i18n.js` (FI/EN-tekstit).
  Kirjastot (GSAP, ScrollTrigger, Lenis) ovat `vendor/`-kansiossa ja fontit `fonts/`-kansiossa — ei build-vaihetta.
- Tekstit ovat sana sanalta nykyiseltä 82rentals.com-sivustolta (etusivu + /vesijettimme, /hinnasto, /meista, /ukk, /yhteystiedot, /varaa). Älä muuta niitä ilman pyyntöä äläkä keksi hintoja, arvosteluja tai väitteitä.
- Yläpalkin linkit vievät sivun omiin osioihin (#jet, #hinnasto, #team, #ukk, #yhteystiedot). Varauslinkit ja footerin alasivulinkit osoittavat nykyiseen 82rentals.com-sivustoon (varausjärjestelmä on siellä).
- Ilme on tumma kauttaaltaan (ei valkoisia osioita), ja jokaisessa osiossa on skrollauksen tahdissa etenevä animaatio tai 3D-liike. Käyttäjän mittapuu on Hinnasto-osio (taustavideo + kortit levittyvät pakasta).
- Laitteisto-osio (#jet) on kiinnitetty näkymä ilman piirrosta: valo paljastaa Higgsfield-jetin, kamera zoomaa osiin 01–04 (main.js `focus` = suhteelliset koordinaatit videon 1. ruudussa, samat kuin `.hs`-pisteiden --x/--y) ja lopuksi jetti pyörähtää 360°.
- Kalusto (#kalusto) = kiinnitetty vaakarulla, Some = puhelin pyörähtää ympäri, Arvostelut = tähdet täyttyvät, Finaali (#finale) = kuva avautuu koko ruudulle.
- Julkaisu: push `main`-haaraan → Vercel julkaisee automaattisesti. Käyttäjä haluaa muutokset suoraan livenä.
- Hero-video: `media/hero.mp4` (1080p) ja `media/hero-720.mp4` (mobiili), Higgsfield Seedance 2.0, ei ääntä. Toistetaan kerran ja jäädään viimeiseen ruutuun.
- Laitteisto-osio käyttää `media/jet-spin.mp4`-videota (Higgsfield, 360°-pyörähdys, juliste `media/jet-spin-poster.jpg`) , hinnaston taustalla on `media/archipelago.mp4` (saaristolento) ja finaalissa `media/finale.mp4` (jetti kiihdyttää auringonlaskuun). Kalusto-korttien kuvat `media/feat-1..4.jpg` ja arvostelujen tausta `media/underwater.mp4` (edestakainen loop) ovat myös Higgsfieldistä. Molemmat on sidottu skrollaukseen (`scrubVideo` main.js:ssä), joten ne on pakattu tiheillä avainruuduilla (`ffmpeg -g 2`). Python http.server ei tue Range-pyyntöjä, joten videohaku ei toimi sillä paikallisesti; Vercel tukee niitä.
- Higgsfield-generoinneista kerrotaan aina kredit-arvio ja odotetaan käyttäjän vahvistusta.
