import { expect } from 'chai';
import request from 'supertest';
import app from '../src/app.js';

const BASE = '/veiculos';

const validBase = {
  marca: 'Toyota',
  modelo: 'Corolla',
  ano: 2020,
  preco: 85000,
};

describe('GET /veiculos', () => {
  it('Listar veículos retorna array vazio quando nenhum cadastrado', async () => {
    const res = await request(app).get(BASE);

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array');
  });

  it('Listar veículos retorna veículo recém-cadastrado com todos os campos', async () => {
    const payload = { marca: 'Ford', modelo: 'Ka', ano: 2019, preco: 45000, placa: 'FOR-0001' };

    await request(app).post(BASE).send(payload);
    const res = await request(app).get(BASE);

    expect(res.status).to.equal(200);
    const found = res.body.find(v => v.placa === payload.placa);
    expect(found).to.deep.include(payload);
    expect(found).to.have.property('id').that.is.a('number');
  });
});

describe('POST /veiculos', () => {
  describe('SUCESSO', () => {
    it('Cadastrar veículo com placa antiga válida', async () => {
      const payload = { ...validBase, placa: 'ABC-1234' };
      const res = await request(app).post(BASE).send(payload);

      expect(res.status).to.equal(201);
      expect(res.body).to.include({ placa: 'ABC-1234' });
      expect(res.body).to.have.property('id').that.is.a('number');
    });

    it('Cadastrar veículo com placa Mercosul (AAA0A00) válida', async () => {
      const payload = { ...validBase, placa: 'DEF1G23' };
      const res = await request(app).post(BASE).send(payload);

      expect(res.status).to.equal(201);
      expect(res.body).to.include({ placa: 'DEF1G23' });
      expect(res.body).to.have.property('id').that.is.a('number');
    });
  });

  describe('CAMPOS OBRIGATORIOS', () => {
    it('Rejeitar veículo sem marca', async () => {
      const intent = 'Tentar cadastrar sem informar marca';
      const { marca, ...payload } = { ...validBase, placa: 'GHI-5678' };

      const res = await request(app).post(BASE).send(payload);

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error');
    });

    it('Rejeitar veículo sem modelo', async () => {
      const { modelo, ...payload } = { ...validBase, placa: 'JKL-9012' };
      const res = await request(app).post(BASE).send(payload);

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error');
    });
  });

  // ── VALIDATION: ANO ────────────────────────────────────────────────────────

  it('Rejeitar ano anterior a 1886', async () => {
    const payload = { ...validBase, ano: 1800, placa: 'MNO-3456' };
    const res = await request(app).post(BASE).send(payload);

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error');
  });

  it('Rejeitar ano posterior a 2027', async () => {
    const payload = { ...validBase, ano: 2028, placa: 'PQR-7890' };
    const res = await request(app).post(BASE).send(payload);

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error');
  });

  // ── VALIDATION: PREÇO ──────────────────────────────────────────────────────

  it('Rejeitar preço igual a zero', async () => {
    const payload = { ...validBase, preco: 0, placa: 'STU-1234' };
    const res = await request(app).post(BASE).send(payload);

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error');
  });

  it('Rejeitar preço negativo', async () => {
    const payload = { ...validBase, preco: -1, placa: 'VWX-5678' };
    const res = await request(app).post(BASE).send(payload);

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error');
  });

  // ── VALIDATION: PLACA ──────────────────────────────────────────────────────

  it('Rejeitar placa com formato inválido', async () => {
    const payload = { ...validBase, placa: 'INVALID' };
    const res = await request(app).post(BASE).send(payload);

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error');
  });

  it('Rejeitar placa duplicada', async () => {
    const payload = { ...validBase, placa: 'YZA-9999' };

    await request(app).post(BASE).send(payload);
    const res = await request(app).post(BASE).send(payload);

    expect(res.status).to.equal(409);
    expect(res.body).to.deep.equal({
      error: 'Conflict',
      message: 'A placa YZA-9999 já está cadastrada no sistema.',
    });
  });
});
