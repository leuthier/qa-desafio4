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

  it('Listar veículos retorna todos os veículos previamente cadastrados', async () => {
    await request(app).post(BASE).send({ ...validBase, placa: 'LST-0001' });
    await request(app).post(BASE).send({ ...validBase, placa: 'LST-0002' });
    const res = await request(app).get(BASE);

    expect(res.status).to.equal(200);
    const placas = res.body.map(v => v.placa);
    expect(placas).to.include('LST-0001');
    expect(placas).to.include('LST-0002');
  });
});

describe('POST /veiculos', () => {
  describe('SUCESSO - 201', () => {
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

    it('Contém exatamente os campos id, marca, modelo, ano, preco, placa', async () => {
      const payload = { ...validBase, placa: 'RSP-0001' };
      const res = await request(app).post(BASE).send(payload);

      expect(res.status).to.equal(201);
      expect(res.body).to.deep.include(payload);
      expect(res.body).to.have.property('id').that.is.a('number');
      expect(Object.keys(res.body)).to.have.members(['id', 'marca', 'modelo', 'ano', 'preco', 'placa']);
    });

    it('IDs de veículos distintos são únicos e incrementais', async () => {
      const res1 = await request(app).post(BASE).send({ ...validBase, placa: 'IDU-0001' });
      const res2 = await request(app).post(BASE).send({ ...validBase, placa: 'IDU-0002' });

      expect(res1.body.id).to.be.a('number');
      expect(res2.body.id).to.be.a('number');
      expect(res2.body.id).to.be.greaterThan(res1.body.id);
    });

    it('Aceitar preco mínimo positivo (0.01)', async () => {
      const payload = { ...validBase, preco: 0.01, placa: 'EDG-0006' };
      const res = await request(app).post(BASE).send(payload);

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('preco', 0.01);
    });

    it('Aceitar ano no limite inferior (1886)', async () => {
      const payload = { ...validBase, ano: 1886, placa: 'EDG-0007' };
      const res = await request(app).post(BASE).send(payload);

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('ano', 1886);
    });

    it('Aceitar ano no limite superior (2027)', async () => {
      const payload = { ...validBase, ano: 2027, placa: 'EDG-0008' };
      const res = await request(app).post(BASE).send(payload);

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('ano', 2027);
    });
  });

  describe('CAMPOS OBRIGATORIOS AUSENTES - 400', () => {
    it('Rejeitar veículo sem marca', async () => {
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

    it('Rejeitar veículo sem ano', async () => {
      const { ano, ...payload } = { ...validBase, placa: 'SAN-0001' };
      const res = await request(app).post(BASE).send(payload);

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error');
    });

    it('Rejeitar veículo sem preco', async () => {
      const { preco, ...payload } = { ...validBase, placa: 'SPR-0001' };
      const res = await request(app).post(BASE).send(payload);

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error');
    });

    it('Rejeitar veículo sem placa', async () => {
      const res = await request(app).post(BASE).send(validBase);

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error');
    });
  });

  // ── VALIDATION: ANO ────────────────────────────────────────────────────────

  describe('STATUS CODE - 400', () => {
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
  });

  describe('STATUS CODE - 409', () => {
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

  // ── EDGE CASES ─────────────────────────────────────────────────────────────

  describe('EDGE-CASES', () => {
    it('Rejeitar ano como número decimal (float)', async () => {
      const payload = { ...validBase, ano: 2020.5, placa: 'EDG-0001' };
      const res = await request(app).post(BASE).send(payload);

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error');
    });

    it('Rejeitar ano como string numérica', async () => {
      const payload = { ...validBase, ano: '2020', placa: 'EDG-0002' };
      const res = await request(app).post(BASE).send(payload);

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error');
    });

    it('Rejeitar preco como string numérica', async () => {
      const payload = { ...validBase, preco: '85000', placa: 'EDG-0003' };
      const res = await request(app).post(BASE).send(payload);

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error');
    });

    it('Rejeitar marca como string vazia', async () => {
      const payload = { ...validBase, marca: '', placa: 'EDG-0004' };
      const res = await request(app).post(BASE).send(payload);

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error');
    });

    it('Rejeitar modelo como string vazia', async () => {
      const payload = { ...validBase, modelo: '', placa: 'EDG-0005' };
      const res = await request(app).post(BASE).send(payload);

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error');
    });

    it('Rejeitar placa com letras minúsculas no formato antigo', async () => {
      const payload = { ...validBase, placa: 'abc-1234' };
      const res = await request(app).post(BASE).send(payload);

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error');
    });

    it('Rejeitar corpo completamente vazio', async () => {
      const res = await request(app).post(BASE).send({});

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error');
    });
  });
});
