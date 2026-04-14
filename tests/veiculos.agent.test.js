import request from 'supertest';
import app from '../src/app.js';

const BASE = '/veiculos';

const validBase = {
  marca: 'Toyota',
  modelo: 'Corolla',
  ano: 2020,
  preco: 85000,
};

describe('POST /veiculos — agentic tests', () => {
  // ── SUCCESS CASES ──────────────────────────────────────────────────────────

  test('Agent: cadastrar veículo com placa antiga válida', async () => {
    // Setup
    const intent = 'Cadastrar veículo com placa no formato antigo (AAA-0000)';
    const payload = { ...validBase, placa: 'ABC-1234' };

    // Action
    const res = await request(app).post(BASE).send(payload);

    // Verify
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: expect.any(Number), placa: 'ABC-1234' });
  });

  test('Agent: cadastrar veículo com placa Mercosul válida', async () => {
    const intent = 'Cadastrar veículo com placa no padrão Mercosul (AAA0A00)';
    const payload = { ...validBase, placa: 'DEF1G23' };

    const res = await request(app).post(BASE).send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: expect.any(Number), placa: 'DEF1G23' });
  });

  // ── VALIDATION: CAMPOS OBRIGATÓRIOS ────────────────────────────────────────

  test('Agent: rejeitar veículo sem marca', async () => {
    const intent = 'Tentar cadastrar sem informar marca';
    const { marca, ...payload } = { ...validBase, placa: 'GHI-5678' };

    const res = await request(app).post(BASE).send(payload);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('Agent: rejeitar veículo sem modelo', async () => {
    const intent = 'Tentar cadastrar sem informar modelo';
    const { modelo, ...payload } = { ...validBase, placa: 'JKL-9012' };

    const res = await request(app).post(BASE).send(payload);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // ── VALIDATION: ANO ────────────────────────────────────────────────────────

  test('Agent: rejeitar ano anterior a 1886', async () => {
    const intent = 'Tentar cadastrar com ano 1800 (antes do primeiro automóvel)';
    const payload = { ...validBase, ano: 1800, placa: 'MNO-3456' };

    const res = await request(app).post(BASE).send(payload);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('Agent: rejeitar ano posterior a 2027', async () => {
    const intent = 'Tentar cadastrar com ano 2028 (acima do limite permitido)';
    const payload = { ...validBase, ano: 2028, placa: 'PQR-7890' };

    const res = await request(app).post(BASE).send(payload);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // ── VALIDATION: PREÇO ──────────────────────────────────────────────────────

  test('Agent: rejeitar preço igual a zero', async () => {
    const intent = 'Tentar cadastrar com preço 0 (não permitido)';
    const payload = { ...validBase, preco: 0, placa: 'STU-1234' };

    const res = await request(app).post(BASE).send(payload);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('Agent: rejeitar preço negativo', async () => {
    const intent = 'Tentar cadastrar com preço -1 (valor negativo)';
    const payload = { ...validBase, preco: -1, placa: 'VWX-5678' };

    const res = await request(app).post(BASE).send(payload);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // ── VALIDATION: PLACA ──────────────────────────────────────────────────────

  test('Agent: rejeitar placa com formato inválido', async () => {
    const intent = 'Tentar cadastrar com placa INVALID (não segue padrões BR/Mercosul)';
    const payload = { ...validBase, placa: 'INVALID' };

    const res = await request(app).post(BASE).send(payload);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('Agent: rejeitar placa duplicada', async () => {
    const intent = 'Tentar cadastrar dois veículos com a mesma placa';
    const payload = { ...validBase, placa: 'YZA-9999' };

    await request(app).post(BASE).send(payload);
    const res = await request(app).post(BASE).send(payload);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
