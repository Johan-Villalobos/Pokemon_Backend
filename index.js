require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { createClient } = require('@supabase/supabase-js');

// ── Supabase client ──────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// ── Express setup ────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ── Helper: formato de respuesta consistente ─────────────────
const ok  = (res, data)         => res.json({ ok: true,  data });
const err = (res, msg, code=404) => res.status(code).json({ ok: false, error: msg });

// ── ROUTES ───────────────────────────────────────────────────

/**
 * GET /
 * Health-check — usado por Render para detectar que el servicio está vivo
 */
app.get('/', (_req, res) => {
  res.json({ service: 'pokemon-api', status: 'ok' });
});

/**
 * GET /pokemons
 * Lista todos los pokémons disponibles (solo nombre + sprite frontal)
 */
app.get('/pokemons', async (_req, res) => {
  const { data, error } = await supabase
    .from('pokemons')
    .select('id, name, sprite_front, types')
    .order('id');

  if (error) return err(res, error.message, 500);
  ok(res, data);
});

/**
 * GET /pokemons/:name
 * Busca un pokémon por nombre (coincidencia exacta, case-insensitive)
 * Devuelve el objeto con la forma que espera la app React Native
 */
app.get('/pokemons/:name', async (req, res) => {
  const name = req.params.name.toLowerCase().trim();

  const { data, error } = await supabase
    .from('pokemons')
    .select('*')
    .ilike('name', name)
    .maybeSingle();

  if (error)  return err(res, error.message, 500);
  if (!data)  return err(res, `Pokémon "${name}" no encontrado`);

  // Transformar al shape que usa PokemonContext.tsx
  const pokemon = {
    name:   data.name,
    height: data.height,
    weight: data.weight,
    sprites: {
      front_default: data.sprite_front,
      back_default:  data.sprite_back,
      front_shiny:   data.sprite_shiny,
    },
    types: data.types.map(t => ({ type: { name: t } })),
  };

  ok(res, pokemon);
});

// ── Iniciar servidor ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 pokemon-api corriendo en puerto ${PORT}`);
});
