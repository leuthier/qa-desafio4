import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import { join } from 'path';

const swaggerDoc = load(readFileSync(join(process.cwd(), 'swagger.yaml'), 'utf8'));

const app = express();
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

const veiculos = [];
let nextId = 1;

const PLACA_ANTIGA = /^[A-Z]{3}-\d{4}$/;
const PLACA_MERCOSUL = /^[A-Z]{3}\d[A-Z]\d{2}$/;

function validate(body) {
  const { marca, modelo, ano, preco, placa } = body;

  if (marca === undefined || marca === null || marca === '') return 'marca obrigatória';
  if (typeof marca !== 'string') return 'marca deve ser do tipo texto';
  if (marca.length > 100) return 'marca deve ter no máximo 100 caracteres';
  if (modelo === undefined || modelo === null || modelo === '') return 'modelo obrigatório';
  if (typeof modelo !== 'string') return 'modelo deve ser do tipo texto';
  if (modelo.length > 100) return 'modelo deve ter no máximo 100 caracteres';
  if (!Number.isInteger(ano) || ano < 1886 || ano > 2027) return 'ano deve ser inteiro entre 1886 e 2027';
  if (preco === undefined || preco === null || typeof preco !== 'number' || isNaN(preco)) return 'preco obrigatório';
  if (preco <= 0) return 'preco deve ser número maior que 0';
  if (preco > Number.MAX_SAFE_INTEGER) return 'preco deve ser no máximo 9007199254740991';
  if (!placa || typeof placa !== 'string') return 'placa obrigatória';
  if (!PLACA_ANTIGA.test(placa) && !PLACA_MERCOSUL.test(placa)) return 'placa inválida';
  return null;
}

app.get('/veiculos', (req, res) => {
  return res.status(200).json(veiculos);
});

app.post('/veiculos', (req, res) => {
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });

  const { marca, modelo, ano, preco, placa } = req.body;

  if (veiculos.some(v => v.placa === placa)) {
    return res.status(409).json({
      error: 'Conflict',
      message: `Placa ${placa} já cadastrada no sistema.`,
    });
  }
  const veiculo = { id: nextId++, marca, modelo, ano, preco, placa };
  veiculos.push(veiculo);
  return res.status(201).json(veiculo);
});

export default app;
