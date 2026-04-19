# pokemon-backend

API REST para el buscador de Pokémon. Node.js + Express + Supabase, desplegada en Render.

## Estructura

```
pokemon-backend/
├── scripts/
│   └── supabase_setup.sql   ← Ejecutar en Supabase SQL Editor
├── src/
│   └── index.js             ← Servidor Express
├── .env.example             ← Copiar como .env y rellenar
├── .gitignore
└── package.json
```

## Setup

### 1. Supabase
1. Ir a **Supabase Dashboard → SQL Editor**
2. Ejecutar `scripts/supabase_setup.sql`
3. Copiar **Project URL** y **anon public key** de Settings → API

### 2. Local
```bash
npm install
cp .env.example .env   # rellenar con las credenciales de Supabase
npm run dev
```

### 3. Render
1. Subir este repositorio a GitHub
2. Render → **New Web Service** → conectar repo
3. Agregar variables de entorno: `SUPABASE_URL` y `SUPABASE_ANON_KEY`
4. Start command: `node src/index.js`

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Health check |
| GET | `/pokemons` | Lista los 10 pokémons |
| GET | `/pokemons/:name` | Busca por nombre (ej: `/pokemons/charizard`) |

## Pokémons disponibles
charizard, blastoise, nidoking, arcanine, alakazam, machamp, golem, gyarados, dragonite, lucario
