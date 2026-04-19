require('dotenv').config();
const express        = require('express');
const cors           = require('cors');
const swaggerUi      = require('swagger-ui-express');
const swaggerJsdoc   = require('swagger-jsdoc');
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

// ── Swagger config ───────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Pokémon API',
      version: '1.0.0',
      description: 'API REST para consultar información de Pokémons almacenados en Supabase.',
    },
    servers: [
      {
        url: `https://pokemon-backend-9mjm.onrender.com`,
        description: 'Servidor local',
      },
    ],
    components: {
      schemas: {
        PokemonSummary: {
          type: 'object',
          properties: {
            id:          { type: 'integer', example: 1 },
            name:        { type: 'string',  example: 'bulbasaur' },
            sprite_front:{ type: 'string',  example: 'https://raw.githubusercontent.com/.../front_default.png' },
            types:       { type: 'array', items: { type: 'string' }, example: ['grass', 'poison'] },
          },
        },
        PokemonDetail: {
          type: 'object',
          properties: {
            name:   { type: 'string',  example: 'bulbasaur' },
            height: { type: 'integer', example: 7 },
            weight: { type: 'integer', example: 69 },
            sprites: {
              type: 'object',
              properties: {
                front_default: { type: 'string', example: 'https://...' },
                back_default:  { type: 'string', example: 'https://...' },
                front_shiny:   { type: 'string', example: 'https://...' },
              },
            },
            types: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: {
                    type: 'object',
                    properties: { name: { type: 'string', example: 'grass' } },
                  },
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            ok:    { type: 'boolean', example: false },
            error: { type: 'string',  example: 'Pokémon "pikachu" no encontrado' },
          },
        },
      },
    },
  },
  apis: ['./index.js'], // Lee las anotaciones JSDoc de este mismo archivo
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Pokémon API Docs',
}));

// ── Helper: formato de respuesta consistente ─────────────────
const ok  = (res, data)          => res.json({ ok: true,  data });
const err = (res, msg, code=404) => res.status(code).json({ ok: false, error: msg });

// ── ROUTES ───────────────────────────────────────────────────

/**
 * @swagger
 * /:
 *   get:
 *     summary: Health-check del servicio
 *     description: Endpoint usado por Render para verificar que el servicio está vivo.
 *     tags:
 *       - General
 *     responses:
 *       200:
 *         description: Servicio activo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 service: { type: string, example: pokemon-api }
 *                 status:  { type: string, example: ok }
 */
app.get('/', (_req, res) => {
  res.json({ service: 'pokemon-api', status: 'ok' });
});

/**
 * @swagger
 * /pokemons:
 *   get:
 *     summary: Lista todos los Pokémons
 *     description: Devuelve un arreglo con todos los Pokémons disponibles (id, nombre, sprite frontal y tipos).
 *     tags:
 *       - Pokémons
 *     responses:
 *       200:
 *         description: Lista de Pokémons obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PokemonSummary'
 *       500:
 *         description: Error interno al consultar Supabase
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 * @swagger
 * /pokemons/{name}:
 *   get:
 *     summary: Busca un Pokémon por nombre
 *     description: Retorna el detalle completo de un Pokémon usando coincidencia exacta e insensible a mayúsculas.
 *     tags:
 *       - Pokémons
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre del Pokémon (ej. pikachu, bulbasaur)
 *         example: pikachu
 *     responses:
 *       200:
 *         description: Pokémon encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PokemonDetail'
 *       404:
 *         description: Pokémon no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno al consultar Supabase
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
  console.log(`📖 Swagger docs disponibles en http://localhost:${PORT}/api-docs`);
});