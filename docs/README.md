# Documento dei Requisiti — Stopify (LaTeX)

Scaffold per il documento dei requisiti del progetto, pensato per essere
caricato su [Overleaf](https://www.overleaf.com).

## Struttura

```
docs/
├── main.tex                  # entry point, include tutte le sezioni
├── preamble.tex              # pacchetti, stile, macro
├── README.md                 # questo file
├── images/                   # immagini e diagrammi (PNG/PDF)
└── sections/
    ├── 00-copertina.tex
    ├── 01-descrizione.tex
    ├── 02-stakeholders.tex
    ├── 03-architettura-hw-sw.tex
    ├── 04-architettura-rete.tex
    ├── 05-tecnologie.tex
    ├── 06-requisiti.tex
    ├── 07-use-cases.tex
    ├── 08-glossario.tex
    ├── 09-architettura-sistema.tex
    └── 10-sicurezza.tex
```

## Come caricare su Overleaf

1. Comprimi la cartella `docs/` in un file `.zip`:

   ```bash
   cd ~/Documents/Uni/Magistrale/Stopify
   zip -r stopify-docs.zip docs
   ```

2. Su [overleaf.com](https://www.overleaf.com): **New Project → Upload Project**
   e seleziona `stopify-docs.zip`.

3. Imposta `main.tex` come main document (di solito è automatico).

4. Compila con **pdfLaTeX**. Compilazione attesa: senza errori, con qualche
   warning innocuo del tipo "underfull/overfull hbox".

## Cosa devi ancora fare

I `\TODO{...}` rossi nel PDF segnalano i punti da completare. Sono **5
immagini** da inserire nella cartella `images/`:

| File da creare | Cosa rappresenta | Tool consigliato |
|---|---|---|
| `images/architettura-deployment.png` | schema deployment in produzione (reverse proxy + Flask + DB) | draw.io |
| `images/use-case-diagram.png` | Use Case Diagram UML | draw.io / Excalidraw |
| `images/class-diagram.png` | Class Diagram UML del dominio | draw.io |
| `images/architettura-blocchi.png` | diagramma a blocchi del sistema | draw.io |
| `images/schema-db.png` | schema ER del database | draw.io / dbdiagram.io |

Per inserirli, sostituisci nei file `.tex` il blocco `\fbox{\parbox{...}{...\TODO{...}...}}`
con la riga `\includegraphics{...}` corrispondente (già presente, commentata).

Esempio per il use case:

```latex
\begin{figure}[H]
    \centering
    \includegraphics[width=0.85\textwidth]{use-case-diagram.png}
    \caption{Use Case Diagram di Stopify.}
    \label{fig:usecase}
\end{figure}
```

## Suggerimenti operativi

- **Anteprima locale dei diagrammi**: usa [draw.io desktop](https://github.com/jgraph/drawio-desktop/releases) (offline) per disegnare in `.drawio` e poi `File → Export → PNG` con risoluzione 2×.
- **PDF invece di PNG**: se vuoi diagrammi vettoriali, esporta in PDF e cambia `.png` in `.pdf` nel codice — `\includegraphics` gestisce entrambi senza modifiche.
- **Versionamento**: tieni i sorgenti `.drawio` in `docs/images/sources/` per poterli rimodificare in futuro.
- **Tabelle troppo larghe**: se eccedono il margine, sostituisci `tabularx` con `longtable` o riduci a `\small`.

## Compilare dal terminale (alternativa a Overleaf)

```bash
cd docs
latexmk -pdf main.tex
```

Richiede `mactex-no-gui` (`brew install --cask mactex-no-gui`) oppure
TeX Live su Linux.

## Note di stile

- I `\TODO{...}` appaiono in rosso nel PDF per ricordare ciò che manca:
  vanno tolti tutti prima della consegna.
- Le tabelle usano `booktabs` (regole `\toprule`/`\midrule`/`\bottomrule`)
  — niente bordi verticali, per coerenza tipografica.
- I nomi degli endpoint sono formattati con la macro `\endpoint{}{}`
  definita nel preamble.
