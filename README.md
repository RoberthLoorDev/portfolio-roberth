# Astro Starter Kit: Basics

```sh
npm create astro@latest -- --template basics
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/basics)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/withastro/astro/tree/latest/examples/basics)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/withastro/astro?devcontainer_path=.devcontainer/basics/devcontainer.json)

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

![just-the-basics](https://github.com/withastro/astro/assets/2244813/a0a5533c-a856-4198-8470-2d67b1d7c554)

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   └── Card.astro
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## Chat del portafolio

El chat responde con tu información usando búsqueda semántica local (sin base de datos):

1. Edita tu experiencia, proyectos y habilidades en `src/data/portfolioData.ts`. Es lo ÚNICO que lee el chat
   (no lee los `.md` de `src/content/projects`), así que mantén fechas, cargos y datos de contacto
   iguales a los del sitio (`Experience.astro`, `translations.ts`). Un fragmento por tema, en tercera
   persona y texto plano, de unos 400 a 900 caracteres.
2. Corre `npm run embed`. Genera `src/data/embeddings.json` y solo vuelve a llamar a Gemini
   para los textos que cambiaron.
3. Haz commit (incluido `embeddings.json`) y push. Vercel despliega solo.

`npm run build` falla si olvidas el paso 2 (`npm run embed:check`), para no publicar datos viejos.

### Variables de entorno

Copia `.env.example` a `.env`. En Vercel agrégalas en Settings → Environment Variables.

- `GOOGLE_API_KEY`: embeddings (siempre Gemini) y respaldo del chat.
- `GROQ_API_KEY`: modelo principal de respuestas (por defecto `openai/gpt-oss-20b`).
- `LLM_PROVIDER`: `groq` (por defecto) o `gemini`. El otro actúa como respaldo si falla.
- `BREVO_API_KEY` y `RECIPIENT_EMAIL`: formulario de contacto.

### Requisitos

Node 24 (`engines` en `package.json`). En Vercel: Settings → General → Node.js Version → 24.x.

### Límites del chat

Por IP: 8 preguntas por minuto y 30 por hora; en total 25 por minuto. Las preguntas repetidas se
responden desde una caché en memoria. Estos límites viven en la memoria de cada instancia
serverless, así que frenan el uso abusivo casual, no un ataque dirigido.
