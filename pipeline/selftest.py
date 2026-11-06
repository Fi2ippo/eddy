#!/usr/bin/env python3
"""Autotest della raccolta, senza rete: pulizia, filtri, radici, argomenti, raggruppamento, id stabili.

Uso: python pipeline/selftest.py   (esce con errore se qualcosa non va; gira anche su GitHub Actions)
"""
from __future__ import annotations

import sys
from datetime import timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import cluster  # noqa: E402
import stories  # noqa: E402
import topics  # noqa: E402
from clean import clean_extract, clean_title  # noqa: E402
from common import NOW  # noqa: E402
from filters import is_junk  # noqa: E402
from textproc import proper_nouns, stem  # noqa: E402

FAILS = []


def check(name, cond):
    if not cond:
        FAILS.append(name)
    print(("ok   " if cond else "ERR  ") + name)


# pulizia
ex = clean_extract("<p>(ANSA) - ROMA, 5 NOV - Il governo ha approvato la manovra. Contiene nuove misure. "
                   "Altre novità per le famiglie. Quarta frase da non tenere.</p> Continua a leggere")
check("estratto: niente riga d'agenzia", not ex.startswith("(ANSA)"))
check("estratto: al massimo 3 frasi", ex.count(".") <= 3 and "Quarta" not in ex)
check("estratto: niente 'Continua a leggere'", "Continua" not in ex)
check("estratto: niente 'The post…'", "appeared" not in clean_extract("A long enough sentence about the news today. The post Title appeared first on Site."))
check("estratto: niente credito foto", "Getty" not in clean_extract("Una frase abbastanza lunga sulla notizia del giorno (Getty Images)."))
check("estratto: massimo 420 caratteri", len(clean_extract("Parola " * 200 + ".")) <= 421)
check("titolo: tolto '| Testata'", clean_title("Il titolo della notizia | Il Post", "Il Post") == "Il titolo della notizia")

# filtri
check("filtro: oroscopo", is_junk("Oroscopo di oggi 5 novembre", "https://x.it/a") is not None)
check("filtro: video nell'indirizzo", is_junk("Una notizia qualunque", "https://x.it/video/123") is not None)
check("filtro: 'trade deal' è una notizia", is_junk("US and China reach trade deal", "https://x.com/a") is None)
check("filtro: 'elezione diretta' è una notizia", is_junk("Il premierato e l'elezione diretta del premier", "https://x.it/a") is None)
check("filtro: 'il video mostra' è una notizia", is_junk("Ukraine says bodycam video shows deadly Russian bombing", "https://x.com/a") is None)
check("filtro: '… – live' si scarta", is_junk("Bomb threats reported across Europe – live", "https://x.com/a") is not None)
check("filtro: 'Video:' si scarta", is_junk("Video: il sindaco in piazza", "https://x.it/a") is not None)

# radici e nomi propri
check("radice: condanna = condannato", stem("condanna") == stem("condannato"))
check("radice: allarme = allarmi", stem("allarme") == stem("allarmi"))
check("nomi propri", "#" + stem("joshua") + "_wong" in proper_nouns("Hong Kong condanna Joshua Wong a 10 anni"))

# argomenti
check("argomento: clima -> ambiente", "ambiente" in topics.lexicon_topics("Il cambiamento climatico accelera", ""))
check("argomento: borse -> economia", "economia" in topics.lexicon_topics("Borse europee in rialzo dopo la Bce", ""))
check("argomento: sezione vince", topics.article_topics({"title": "Qualcosa", "topic_hint": "cultura"})[0] == "cultura")
check("lessico: 'saluta' non è scienza", "scienza" not in topics.lexicon_topics("Ronaldo saluta la Nazionale", ""))
check("lessico: 'il video mostra' non è cultura", "cultura" not in topics.lexicon_topics("Il video mostra la folla in piazza", ""))
check("lessico: 'partite' non è politica", "politica" not in topics.lexicon_topics("Le partite di stasera in Champions", ""))
check("categoria: una sezione business non vince su tanti titoli sui voli",
      topics.story_topics([{"title": "a", "topics": ["economia", "societa"], "topic_hint": "economia", "via": "feed"}]
                          + [{"title": "b", "topics": ["societa"], "via": "google_news"}] * 4)[0] == "societa")
check("area: esteri -> mondo", topics.article_area({"title": "x", "area_hint": "mondo"}) == "mondo")
check("area: Roma -> italia", topics.article_area({"title": "Sciopero dei treni a Roma e Milano", "src_area": "italia"}) == "italia")


# raggruppamento
def art(i, src, title, extract="", lang="it", hours=1, via="feed"):
    return {"id": f"a{i}", "source_id": src, "source": src.upper(), "lang": lang, "section": None, "title": title,
            "extract": extract, "published": NOW - timedelta(hours=hours), "first_seen": NOW - timedelta(hours=hours),
            "via": via, "image": None, "topics": [], "area": "mondo", "url": f"https://{src}.it/{i}"}


arts = [
    art(1, "ansa", "Hong Kong, altri 10 anni di carcere all'attivista Joshua Wong", "Condannato per collusione con forze straniere."),
    art(2, "post", "Hong Kong ha condannato ad altri 10 anni Joshua Wong", "La condanna per la campagna sulle sanzioni."),
    art(3, "bbc", "Hong Kong activist Joshua Wong gets 10 more years", "", lang="en"),
    art(4, "post", "Tre allarmi bomba su voli diretti in Italia", "Gli aerei sono stati fatti atterrare in Francia."),
    art(5, "stampa", "Allarmi bomba sui voli Dublino-Roma e Helsinki-Roma", "Atterraggi di emergenza in Francia e Belgio."),
    art(6, "ansa", "Al Salone del libro di Torino record di visitatori", "Oltre duecentomila presenze."),
    art(7, "ansa", "Nuovo record di visitatori per la mostra di Monet a Milano", "Code davanti a Palazzo Reale."),
]
arts[2]["title_it"] = "L'attivista di Hong Kong Joshua Wong ottiene altri 10 anni"
for a in arts:
    a["topics"] = topics.article_topics(a)
groups, vec = cluster.cluster(arts)
sets = [sorted(arts[i]["id"] for i in g) for g in groups]
check("gruppo: Joshua Wong in italiano e inglese insieme", ["a1", "a2", "a3"] in sets)
check("gruppo: allarmi bomba insieme", ["a4", "a5"] in sets)
check("gruppo: notizie diverse separate", ["a6"] in sets and ["a7"] in sets)
check("gruppo: mai la stessa testata due volte", all(len({arts[i]["source_id"] for i in g}) == len(g) for g in groups))
gn = [art(8, "reuters", "Hong Kong activist Joshua Wong jailed for 10 more years", lang="en", via="google_news")]
gn[0]["title_it"] = "L'attivista di Hong Kong Joshua Wong incarcerato per altri 10 anni"
att = cluster.attach_google_news(groups, arts, gn, vec)
check("Google News: agganciato alla storia giusta", any(sorted(arts[i]["id"] for i in groups[gi]) == ["a1", "a2", "a3"] for gi in att))

# id stabili: la storia si arricchisce ma l'id resta
g1 = [[arts[0], arts[1]]]
ids1 = stories.assign_ids(g1, {})
mem = {"a1": {"story": ids1[0]}, "a2": {"story": ids1[0]}}
ids2 = stories.assign_ids([[arts[0], arts[1], arts[2]]], mem)
check("id stabile quando la storia si arricchisce", ids1 == ids2)

# nomi propri per confronto e "Per capire"
import enrich  # noqa: E402

nm = enrich.names_in("L'attivista di Hong Kong Joshua Wong condannato. Arriva all'Alta Corte. La Banca d'Inghilterra alza i tassi.")
check("nomi: 'Banca d'Inghilterra' resta intero", "Banca d'Inghilterra" in nm)
check("nomi: 'L'attivista' non è un nome", not any(n.lower().startswith("l'attivista") for n in nm))
check("nomi: 'Arriva' a inizio frase non si attacca", not any(n.startswith("Arriva") for n in nm))

# confronto: il nome di una testata non è un "dettaglio solo in alcune testate"
cmp_arts = [dict(art(20 + i, src, t), title_it=t) for i, (src, t) in enumerate([
    ("ansa", "Hong Kong, condannato Joshua Wong"), ("post", "Hong Kong, Joshua Wong condannato a dieci anni"),
    ("efe", "Hong Kong condanna Joshua Wong - EFE"), ("stampa", "Joshua Wong condannato, proteste a Londra")])]
for a, nm in zip(cmp_arts, ["ANSA", "Il Post", "EFE", "La Stampa"]):
    a["source"] = nm
cmpb = enrich.compare(cmp_arts) or {"unique": []}
check("confronto: il nome della testata non compare tra i dettagli", all(u["text"] != "EFE" for u in cmpb["unique"]))

# titoli di Google News: il nome della testata in fondo si toglie, anche ripetuto
import feeds  # noqa: E402

check("Google News: tolto ' - EFE' ripetuto", feeds.gn_title("Wong handed 10 years in jail - EFE - EFE", "EFE") == "Wong handed 10 years in jail")

# lingua: una fonte segnata come spagnola che scrive in inglese (EFE) si traduce dall'inglese
import collect  # noqa: E402

efe = [{"lang": "es", "source_id": "efe", "title": t} for t in [
    "President of Paraguay resigns after Ueno Bank closure", "Russell Brand found guilty of rape, sexual assaults, faces prison",
    "Hong Kong pro-democracy activist Wong handed 10 years in jail"]]
efe += [{"lang": "es", "source_id": "efe-es", "title": t} for t in [
    "El presidente de Paraguay renuncia tras el cierre del banco", "Los mercados caen en Europa por la guerra"]]
check("lingua: EFE in inglese riconosciuta come fonte inglese", collect.english_sources(efe) == {"efe"})
check("lingua: titolo spagnolo non scambiato per inglese", collect.other_hits(efe[3]["title"]) >= 2)

# eventi: sviluppi dello stesso fatto insieme, notizie diverse separate
def st(i, title):
    return {"id": f"s{i}", "title": title, "sources": [{"title": title, "via": "feed"}], "summary": []}


evs = [st(1, "Allarmi bomba su tre voli in Europa, aerei dirottati in Francia"),
       st(2, "Nuovi allarmi bomba sui voli europei: atterraggi di emergenza in Francia"),
       st(3, "Il Papa incontra Bob Dylan in Vaticano")]
stories.assign_events(evs)
check("eventi: due storie sugli allarmi bomba nello stesso evento", evs[0]["event"] == evs[1]["event"] == "s1")
check("eventi: notizia diversa in un altro evento", evs[2]["event"] == "s3")

print()
if FAILS:
    print(f"{len(FAILS)} controlli non superati: " + "; ".join(FAILS))
    sys.exit(1)
print("tutti i controlli superati")
