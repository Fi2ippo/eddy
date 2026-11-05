import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { CONTACT_EMAIL, REMOVAL_FORM_URL, REPO_URL } from "../data/contact";
import BackButton from "./BackButton";

export type AboutSource = { name: string; site: string; area: "italia" | "mondo"; feed: boolean };

// Pagina "Chi siamo · Fonti e crediti": come funziona Eddy, da dove vengono testi e foto, chi ringraziare,
// come chiedere una rimozione e cosa succede ai dati di chi legge.
export default function AboutView({ sources }: { sources: AboutSource[] }) {
  const withExtracts = sources.filter((s) => s.feed);
  const linksOnly = sources.filter((s) => !s.feed);
  return (
    <main className="navigation-page reading-container">
      <header className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center">
        <BackButton />
        <span className="wordmark text-center">Eddy</span>
        <span aria-hidden="true" />
      </header>

      <h1 className="mt-5 text-center">Chi siamo</h1>
      <p className="mx-auto mt-2 max-w-sm text-center text-body text-muted-strong">Fonti, crediti e privacy di Eddy.</p>

      <Block title="Come funziona Eddy">
        <p>
          Eddy è un progetto gratuito e senza pubblicità. Circa ogni mezz’ora un programma legge i feed pubblici delle
          testate, mette insieme gli articoli che parlano dello stesso fatto e li mostra in un’unica storia.
        </p>
        <p>
          In ogni storia trovi solo il titolo e brevi frasi delle testate (al massimo tre per articolo), sempre con il
          nome della testata e il link all’articolo originale. Nessun testo è scritto dall’intelligenza artificiale e
          nessun articolo viene copiato per intero: per leggerlo si va sul sito della testata.
        </p>
        <p>
          Il codice è pubblico su{" "}
          <ExternalLink href={REPO_URL}>GitHub</ExternalLink>.
        </p>
      </Block>

      <Block title="Le fonti">
        <p>
          {withExtracts.length} testate con titolo e brevi estratti, presi dai loro feed pubblici. Altre {linksOnly.length}{" "}
          compaiono solo con titolo e link (“Ne parlano anche”), trovati tramite Google News.
        </p>
        <SourceList title={`Titolo ed estratti brevi (${withExtracts.length})`} items={withExtracts} />
        <SourceList title={`Solo titolo e link (${linksOnly.length})`} items={linksOnly} />
      </Block>

      <Block title="Foto, Wikipedia e traduzioni">
        <p>
          Le foto restano sui siti delle testate: Eddy le mostra direttamente da lì, senza scaricarle né conservarle,
          sempre con il credito “Foto: nome della testata”.
        </p>
        <p>
          I riquadri “Per capire” riportano l’inizio della voce di{" "}
          <ExternalLink href="https://it.wikipedia.org">Wikipedia</ExternalLink>, con il link alla voce, secondo la
          licenza <ExternalLink href="https://creativecommons.org/licenses/by-sa/4.0/deed.it">CC BY-SA</ExternalLink>.
        </p>
        <p>
          Titoli ed estratti delle testate straniere sono tradotti automaticamente con modelli liberi che girano senza
          servizi esterni (OPUS-MT dell’Università di Helsinki e Argos Translate). Ogni traduzione è segnalata con
          “Tradotto dall’inglese” e il titolo originale.
        </p>
      </Block>


      <Block title="Chiedere una rimozione">
        <p>
          Se sei una testata o l’autore di un contenuto e vuoi che Eddy non lo mostri più, scrivici: togliamo i link, gli
          estratti e le foto del tuo sito, e il dominio non verrà più raccolto.
        </p>
        <ul className="flex flex-col gap-2.5">
          <li>
            <a href={REMOVAL_FORM_URL} target="_blank" rel="noopener noreferrer" className="about-link">
              <span>
                Modulo “Richiesta di rimozione” su GitHub
                <span className="sr-only"> (si apre in un’altra scheda)</span>
              </span>
              <ArrowUpRight aria-hidden="true" className="size-5 flex-none" strokeWidth={2.2} />
            </a>
          </li>
          {CONTACT_EMAIL && (
            <li>
              <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Richiesta di rimozione da Eddy")}`} className="about-link">
                <span>Email: {CONTACT_EMAIL}</span>
                <ArrowUpRight aria-hidden="true" className="size-5 flex-none" strokeWidth={2.2} />
              </a>
            </li>
          )}
        </ul>
      </Block>

      <Block title="Privacy">
        <p>
          Eddy non ha account, non usa cookie di profilazione, statistiche o pubblicità e non sa chi sei. Interessi,
          storie salvate e letture restano solo nel tuo browser e puoi cancellarli dal Profilo.
        </p>
        <p>
          Per mostrarti le notizie il browser scarica i dati da GitHub, e le foto arrivano dai siti delle testate (senza
          dire loro da quale pagina arrivi): quei siti vedono la normale richiesta del browser, come per qualsiasi
          immagine sul web.
        </p>
      </Block>
    </main>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="mb-3 text-center text-section">{title}</h2>
      <div className="flex flex-col gap-3 rounded-card bg-surface p-5 text-body text-muted-strong shadow-card-sm">{children}</div>
    </section>
  );
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-bold text-accent underline underline-offset-2">
      {children}
      <span className="sr-only"> (si apre in un’altra scheda)</span>
    </a>
  );
}

function SourceList({ title, items }: { title: string; items: AboutSource[] }) {
  return (
    <details className="about-details">
      <summary>{title}</summary>
      <ul className="mt-2 flex flex-col">
        {items.map((s) => (
          <li key={s.name + s.site} className="border-b border-divider last:border-0">
            <a href={s.site} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-between gap-3 py-2">
              <span className="min-w-0 font-bold text-foreground">{s.name}</span>
              <span className="flex-none text-label text-muted">{s.area === "italia" ? "Italia" : "Mondo"}</span>
              <span className="sr-only"> (si apre in un’altra scheda)</span>
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
