"""Estrae dal progetto Scratch (1915-1918_ I canti al Fronte.sb3) immagini, suoni e percorsi.

Uso:  python3 strumenti/estrai.py "percorso/1915-1918_ I canti al Fronte.sb3" ["cartella Canva" ...]

Le cartelle facoltative contengono i file esportati da Canva in alta risoluzione
(3840x2880, sfondo trasparente per gli sprite, stesso nome del costume Scratch):
se un file c'è, viene usato al posto del costume dell'sb3 e gli sfondi escono a 1920x1440.

Serve Python 3 con Pillow e svgpathtools, e ffmpeg per convertire i suoni in mp3.
Rigenera assets/img, assets/audio e js/grafica.js.
"""
import io, json, os, re, subprocess, sys, tempfile, zipfile

from PIL import Image
from svgpathtools import parse_path

QUI = os.path.dirname(os.path.abspath(__file__))
RADICE = os.path.dirname(QUI)
IMG = os.path.join(RADICE, "assets", "img")
AUDIO = os.path.join(RADICE, "assets", "audio")

sb3 = zipfile.ZipFile(sys.argv[1] if len(sys.argv) > 1 else os.path.join(RADICE, "..", "1915-1918_ I canti al Fronte.sb3"))
CARTELLE_HD = sys.argv[2:]
progetto = json.loads(sb3.read("project.json"))
SPRITE = {t["name"]: t for t in progetto["targets"]}


# costumi Scratch che nei file Canva hanno un altro nome
NOMI_CANVA = {
    "Mark IV male": "MK IVM", "MK IV female": "MK IVF",
    "Fokker2": "Fokker", "Fokker fire2": "Fokker fire", "Breguet2": "Breguet", "Breguet fire2": "Breguet fire",
    "Red Baron2": "Red Baron", "Red Baron fire2": "Red Baron fire", "Royal2": "Royal", "Royal fire2": "Royal fire",
    "01 - Caporale": "Caporale", "02 - Caporal Maggiore": "Caporal Maggiore", "03 - Sgt": "Sgt",
    "04 - Sottotenente": "Sottotenente", "05 - Tenente": "Tenente", "06 - Capitano": "Capitano",
    "07 - Ten-Colonn": "Ten-Colonn", "08 - Colonnello": "Colonnello", "09 - Generale": "Generale",
    "warning": "warning Full Zone", "istruzioni2": "istruzioni", "backdrop resized clouds": "backdrop",
}


def file_hd(nome):
    nome = NOMI_CANVA.get(nome, nome)
    for dir_hd in CARTELLE_HD:
        percorso = os.path.join(dir_hd, nome + ".png")
        if os.path.exists(percorso):
            return percorso
    return None


def costume(sprite, nome):
    for c in SPRITE[sprite]["costumes"]:
        if c["name"] == nome:
            return c
    raise KeyError(f"{sprite} / {nome}")


def immagine(sprite, nome, scala=2):
    """Il costume come RGBA a `scala` pixel per unità Scratch, con il centro di rotazione."""
    c = costume(sprite, nome)
    im = Image.open(io.BytesIO(sb3.read(c["md5ext"]))).convert("RGBA")
    s = scala / c.get("bitmapResolution", 1)
    if s != 1:
        im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    return im, c["rotationCenterX"] * s, c["rotationCenterY"] * s


def cartella(*parti):
    p = os.path.join(IMG, *parti)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    return p


# ---------------------------------------------------------------- sfondi
SFONDI = {
    "titolo": "Thumbnail",
    "carta": "istruzioni2",
    "blocco-1": "start-1° blocco",
    "blocco-2": "2° blocco",
    "blocco-3": "3° blocco",
    "blocco-4": "4° blocco",
    "campo": "backdrop resized",
    "campo-nuvole": "backdrop resized clouds",
    "trincea": "Gradi",
    "fine": "Fine",
    "aerea-persa": "Battaglia aerea persa",
    "aerea-vinta": "Battaglia aerea vinta",
    "carri-persa": "battaglia tank persa",
    "carri-vinta": "battaglia tank vinta",
}
# sfondi che ci sono solo fra i file Canva (scene con la trincea in primo piano)
SOLO_CANVA = {"trincea-1": "4", "trincea-2": "5", "trincea-3": "6"}
for nome, cos in SOLO_CANVA.items():
    if file_hd(cos):
        SFONDI[nome] = cos
for nome, cos in SFONDI.items():
    hd = file_hd(cos)
    im = Image.open(hd).resize((1920, 1440), Image.LANCZOS) if hd else immagine("Stage", cos)[0]
    im.convert("RGB").save(cartella("sfondi", nome + ".jpg"), quality=86, optimize=True, progressive=True)

# il report delle battaglie: tutte perse (stelle barrate) e tutte vinte, il gioco compone le altre
for nome, file in (("report-perse", "report battaglie"), ("report-vinte", "report battaglie (5)")):
    hd = file_hd(file)
    if hd:
        Image.open(hd).convert("RGB").save(cartella("sfondi", nome + ".jpg"), quality=86, optimize=True, progressive=True)

GRAFICA = {}  # nome -> [larghezza, altezza, centro x, centro y] in pixel della scena 960x720


def sprite_png(sprite, cos, nome, scala=2, margine=2):
    """Ritaglia il costume e ne salva il centro di rotazione rispetto al ritaglio.
    Un file Canva (l'intera scena a 1920x1440, centro di rotazione nel mezzo) prende il posto del costume."""
    hd = file_hd(cos)
    if hd:
        im = Image.open(hd).convert("RGBA")
        x0, y0, x1, y1 = im.getbbox()
        x0, y0 = max(0, x0 - margine), max(0, y0 - margine)
        im = im.crop((x0, y0, min(im.width, x1 + margine), min(im.height, y1 + margine)))
        GRAFICA[nome] = [im.width / 2, im.height / 2, (960 - x0) / 2, (720 - y0) / 2]
        q = scala / 4  # i file Canva hanno 4 pixel per unità Scratch
        if q < 1:
            im = im.resize((round(im.width * q), round(im.height * q)), Image.LANCZOS)
        im.save(cartella(nome + ".png"), optimize=True)
        return
    im, cx, cy = immagine(sprite, cos, scala)
    box = im.getbbox()
    x0, y0 = max(0, box[0] - margine), max(0, box[1] - margine)
    x1, y1 = min(im.width, box[2] + margine), min(im.height, box[3] + margine)
    im = im.crop((x0, y0, x1, y1))
    k = 2 / scala
    GRAFICA[nome] = [round(im.width * k, 1), round(im.height * k, 1), round((cx - x0) * k, 1), round((cy - y0) * k, 1)]
    im.save(cartella(nome + ".png"), optimize=True)


# trincea in primo piano (striscia in basso della scena)
sprite_png("trench menu", "trench resized", "trincea-bordo", margine=0)

# mezzi: carri (visti dall'alto, muso a destra) con le 4 fasi dell'esplosione
CARRI = {
    "mark-iv-m": ("Mark IV male", "Mark IV male", "MK IVM expl {}"),
    "mark-iv-f": ("Mark IV female", "MK IV female", "MK IVF expl {}"),
    "saint-chamond": ("Saitn Clar 1", "Char St", "Char St expl {}"),
    "renault": ("Ren 1", "Renault", "Renault expl {}"),
}
for nome, (sp, base, espl) in CARRI.items():
    sprite_png(sp, base, f"mezzi/{nome}", scala=1)
    for i in range(1, 5):
        sprite_png(sp, espl.format(i), f"mezzi/{nome}-{i}", scala=1)

# aerei (con l'ombra a terra), in fiamme e l'esplosione finale
AEREI = {
    "fokker": ("Fokker", "Fokker2", "Fokker fire2", "Fokker boom"),
    "breguet": ("Breguet", "Breguet2", "Breguet fire2", "Breguet boom"),
    "nieuport": ("Nieuport ", "Nieuport", "Nieuport fire", "Nieuport boom"),
    "barone-rosso": ("Red Baron", "Red Baron2", "Red Baron fire2", "Red Baron boom"),
    "royal": ("Royal", "Royal2", "Royal fire2", "Royal boom"),
    "nieuport-2": ("Nieuport 2", "Nieuport 2", "Nieuport 2 fire", "Nieuport 2 boom"),
}
for nome, (sp, base, fuoco, boom) in AEREI.items():
    sprite_png(sp, base, f"mezzi/{nome}", scala=1)
    sprite_png(sp, fuoco, f"mezzi/{nome}-fuoco", scala=1)
    sprite_png(sp, boom, f"mezzi/{nome}-boom", scala=1)

# personaggi, gradi, armi e pulsanti
sprite_png("Soldier 1", "fucile mozzo", "soldato")
sprite_png("Soldier 1", "cappotto", "soldato-cappotto")
sprite_png("Soldier 1", "intero", "soldato-intero")
sprite_png("Ufficiale", "WW1British-Officer-Colonel-Mackenzie-5-Photoroom", "ufficiale")
for c in SPRITE["Gradi"]["costumes"]:
    n = int(c["name"][:2])
    sprite_png("Gradi", c["name"], f"gradi/{n:02d}", scala=3)
sprite_png("Artiglieria", "Pulsante artiglieria ombra", "artiglieria")
sprite_png("Antiaerea", "Pulsante antiaerea ombra", "contraerea")
for c in SPRITE["Countdown"]["costumes"]:
    sprite_png("Countdown", c["name"], "conto/" + c["name"])
for i in range(5):
    sprite_png("guns ammo", f"4 guns ammo {i}", f"munizioni/artiglieria-{i}", scala=1)
    sprite_png("Flak ammo", f"4 flak ammo {i}", f"munizioni/contraerea-{i}", scala=1)
sprite_png("START", "Pulsante Start", "start")
sprite_png("pulsante Istruzioni", "pulsante istruzioni", "istruzioni")
sprite_png("pulsante Istruzioni", "pulsante Istruzioni stella", "stella")
sprite_png("Zona Target Full", "warning", "zona-fascia")
sprite_png("Zona Target Spot", "warning Spot zone", "zona-punti")

# ---------------------------------------------------------------- percorsi
# Le linee guida invisibili (sprite "P ...") che i mezzi seguivano con i sensori rosso e blu:
# qui diventano polilinee in coordinate della scena 960x720, orientate da sinistra a destra.
POS = {t["name"]: (t["x"], t["y"]) for t in progetto["targets"] if not t["isStage"]}
for nome, b in [(n, t["blocks"]) for n, t in SPRITE.items() if n.startswith("P ")]:
    for blocco in b.values():  # la posizione impostata alla bandiera verde
        if isinstance(blocco, dict) and blocco["opcode"] == "motion_gotoxy":
            POS[nome] = (float(blocco["inputs"]["X"][1][1]), float(blocco["inputs"]["Y"][1][1]))
PERCORSI = {}
for nome in sorted(n for n in SPRITE if n.startswith("P ")):
    c = SPRITE[nome]["costumes"][0]
    svg = sb3.read(c["md5ext"]).decode()
    tx, ty = map(float, re.search(r"translate\(([-\d.]+),([-\d.]+)\)", svg).groups())
    d = re.search(r'<path[^>]* d="([^"]+)"', svg).group(1)
    path = parse_path(d)
    x, y = POS[nome]
    punti = []
    n = max(2, int(path.length() / 3))
    for i in range(n + 1):
        z = path.point(i / n)
        sx = x + z.real + tx - c["rotationCenterX"]
        sy = y - (z.imag + ty - c["rotationCenterY"])
        punti.append([round(480 + 2 * sx, 1), round(360 - 2 * sy, 1)])
    if punti[0][0] > punti[-1][0]:
        punti.reverse()
    PERCORSI[nome[2:]] = punti

with open(os.path.join(RADICE, "js", "grafica.js"), "w") as f:
    f.write("// Generato da strumenti/estrai.py: non modificare a mano.\n")
    f.write("// GRAFICA: [larghezza, altezza, centro x, centro y] di ogni immagine, in pixel della scena 960x720.\n")
    f.write("// PERCORSI: le linee che seguono carri e aerei (dagli sprite \"P ...\" dello Scratch).\n")
    f.write("window.GRAFICA = " + json.dumps(GRAFICA, separators=(",", ":")) + ";\n")
    f.write("window.PERCORSI = " + json.dumps(PERCORSI, separators=(",", ":")) + ";\n")

# ---------------------------------------------------------------- suoni
SUONI = {
    "sconfitta": ("Stage", "jingle LOST"),
    "vittoria": ("trench menu", "Victory_happy_soldiers"),
    "carri": ("Fronte", "Tank sounds"),
    "aerei": ("Fronte", "Planes Sounds"),
    "colpo": ("Fronte", "Colpo su legno-muro"),
    "munizione": ("Soldier 1", "+1 Proiett artigl"),
    "carica": ("Soldier 1", "load"),
    "fronte-lontano": ("Soldier 1", "WWI distant sounds 5"),
    "start-arrivo": ("START", "Accel"),
    "start-attesa": ("START", "wait"),
    "start-via": ("START", "away"),
    "gradi": ("Gradi", "jingle Gradi"),
    "fanfara": ("Ufficiale", "victory-fanfare"),
    "sparo-artiglieria": ("Zona Target Full", "WWI - Bombardamento Blast"),
    "sparo-contraerea": ("Zona Target Full", "WWI - Artiglieria Blast"),
    "sirena": ("Zona Target Full", "Sirena guns and whistle"),
    "boato-artiglieria": ("Bomb Full Gif", "WWI - Bombardamento Blast"),
    "boato-contraerea": ("Flak Full Gif", "WWI - Artiglieria Blast"),
    "esplosioni": ("Bomb Full Gif", "Bombing shells"),
    "pronto": ("Countdown", "Ricarica completa arti"),
    "vuoto": ("guns ammo", "rifle-being-reloaded-while-empty"),
}
os.makedirs(AUDIO, exist_ok=True)
for nome, (sp, s) in SUONI.items():
    suono = next(x for x in SPRITE[sp]["sounds"] if x["name"] == s)
    with tempfile.NamedTemporaryFile(suffix="." + suono["dataFormat"]) as tmp:
        tmp.write(sb3.read(suono["md5ext"]))
        tmp.flush()
        lungo = nome in ("fronte-lontano", "carri", "aerei")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp.name,
                        "-ac", "1" if lungo else "2", "-b:a", "80k" if lungo else "128k",
                        os.path.join(AUDIO, nome + ".mp3")], check=True)
print("Fatto:", len(GRAFICA), "immagini,", len(PERCORSI), "percorsi,", len(SUONI), "suoni")
