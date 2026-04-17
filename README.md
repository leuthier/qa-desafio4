# Desafio 4 — API GenAI: Concessionária de Veículos

REST API for vehicle registration with Brazilian and Mercosul plate validation, built with Express.js and documented via Swagger.

---

## Disclaimer

> **This project was generated with [Claude Code](https://claude.ai/code) (Anthropic).**
> AI-generated code can contain mistakes, inaccuracies, or security issues. Always review the code before using it in production. Tests cover the main scenarios but do not guarantee exhaustive coverage. Use this project as a learning reference, not as production-ready software.

---

## Claude Code Prompt

Use the prompt below to replicate this entire project from scratch with Claude Code:

```
Create a Node.js REST API for a vehicle dealership with the following requirements:

- Runtime: Node.js with ES Modules ("type": "module" in package.json)
- Framework: Express.js
- In-memory storage (no database), with an auto-increment integer ID

Endpoints:
  GET  /veiculos  — list all registered vehicles (returns empty array when none exist)
  POST /veiculos  — register a new vehicle

POST /veiculos request body (all fields required):
  - marca  (string, non-empty, max 100 characters)
  - modelo (string, non-empty, max 100 characters)
  - ano    (integer between 1886 and 2027, inclusive)
  - preco  (finite number greater than 0)
  - placa  (string, unique per system, two accepted formats):
      • Old format:    AAA-0000  (3 uppercase letters, hyphen, 4 digits)
      • Mercosul format: AAA0A00 (3 uppercase letters, 1 digit, 1 uppercase letter, 2 digits)

HTTP responses:
  201 — vehicle created, returns full object including generated id
  400 — validation error, returns { error: "<message>" }
  409 — duplicate plate, returns { error: "Conflict", message: "A placa <plate> já está cadastrada no sistema." }

Also:
- Add Swagger UI at /api-docs using swagger-ui-express and a swagger.yaml file (OpenAPI 3.0.3)
- Add a .mocharc.yml configured to run tests/veiculos.test.js with a 1000ms timeout
- Write Mocha + Chai + Supertest tests covering:
    • GET: empty list, returns registered vehicle with all fields, returns multiple vehicles
    • POST SUCESSO - 201: old plate, Mercosul plate, exact response fields, unique incremental IDs,
      preco=0.01, ano=1886, ano=2027
    • POST CAMPOS OBRIGATORIOS AUSENTES - 400: missing marca, modelo, ano, preco, placa
    • POST STATUS CODE - 400: ano < 1886, ano > 2027, preco = 0, preco < 0, invalid plate format
    • POST STATUS CODE - 409: duplicate plate
    • EDGE-CASES subsection: float ano, string ano, string preco, empty string marca/modelo,
      lowercase plate letters, empty body, NaN preco, Infinity preco, number marca, number modelo
    • big-inputs subsection: marca > 100 chars (400), modelo > 100 chars (400),
      marca = 100 chars (201), modelo = 100 chars (201)
```

---

## Project Structure

```
desafio-4-api-genai/
├── src/
│   ├── app.js          # Express app, routes, and validation logic
│   └── server.js       # HTTP server entry point
├── tests/
│   └── veiculos.test.js  # Mocha + Chai + Supertest test suite (36 tests)
├── swagger.yaml        # OpenAPI 3.0.3 specification
├── .mocharc.yml        # Mocha configuration
└── package.json
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm (bundled with Node.js)

---

## Step-by-Step Setup

### 1. Clone or download the project

```bash
git clone <repository-url>
cd desafio-4-api-genai
```

### 2. Install dependencies

```bash
npm install
```

This installs:
- **express** — web framework
- **js-yaml** — parses `swagger.yaml` at startup
- **swagger-ui-express** — serves the Swagger UI
- **mocha**, **chai**, **supertest** — test framework and HTTP assertion library (devDependencies)

---

## Running the API

```bash
npm start
```

The server starts on port **3000**. You should see:

```
Server running on port http://localhost:3000
Swagger: http://localhost:3000/api-docs
Press Ctrl+C to stop the server
```

### Available endpoints

| Method | Path       | Description                        |
|--------|------------|------------------------------------|
| GET    | /veiculos  | List all registered vehicles       |
| POST   | /veiculos  | Register a new vehicle             |

#### Example: register a vehicle

```bash
curl -X POST http://localhost:3000/veiculos \
  -H "Content-Type: application/json" \
  -d '{"marca":"Toyota","modelo":"Corolla","ano":2020,"preco":85000,"placa":"ABC-1234"}'
```

Expected response (`201 Created`):

```json
{
  "id": 1,
  "marca": "Toyota",
  "modelo": "Corolla",
  "ano": 2020,
  "preco": 85000,
  "placa": "ABC-1234"
}
```

### Validation rules

| Field   | Type    | Rules                                              |
|---------|---------|----------------------------------------------------|
| marca   | string  | Required, non-empty, max 100 characters            |
| modelo  | string  | Required, non-empty, max 100 characters            |
| ano     | integer | Required, between 1886 and 2027 (inclusive)        |
| preco   | number  | Required, finite, greater than 0                   |
| placa   | string  | Required, unique, old or Mercosul format (see below) |

---

## Verifying the Swagger Documentation

With the server running, open your browser at:

```
http://localhost:3000/api-docs
```

The Swagger UI displays all endpoints, request/response schemas, accepted plate formats, and example payloads. You can execute requests directly from the browser using the **Try it out** button on each endpoint.

---

## Running the Tests

The tests run against the Express app **without starting the HTTP server** (Supertest handles this internally), so the server does not need to be running.

```bash
npm test
```

Expected output:

```
  GET /veiculos
    ✔ Listar veículos retorna array vazio quando nenhum cadastrado
    ✔ Listar veículos retorna veículo recém-cadastrado com todos os campos
    ✔ Listar veículos retorna todos os veículos previamente cadastrados

  POST /veiculos
    SUCESSO - 201
      ✔ Cadastrar veículo com placa antiga válida
      ✔ Cadastrar veículo com placa Mercosul (AAA0A00) válida
      ✔ Contém exatamente os campos id, marca, modelo, ano, preco, placa
      ✔ IDs de veículos distintos são únicos e incrementais
      ✔ Aceitar preco mínimo positivo (0.01)
      ✔ Aceitar ano no limite inferior (1886)
      ✔ Aceitar ano no limite superior (2027)
    CAMPOS OBRIGATORIOS AUSENTES - 400
      ✔ Rejeitar veículo sem marca
      ✔ Rejeitar veículo sem modelo
      ✔ Rejeitar veículo sem ano
      ✔ Rejeitar veículo sem preco
      ✔ Rejeitar veículo sem placa
    STATUS CODE - 400
      ✔ Rejeitar ano anterior a 1886
      ✔ Rejeitar ano posterior a 2027
      ✔ Rejeitar preço igual a zero
      ✔ Rejeitar preço negativo
      ✔ Rejeitar placa com formato inválido
    STATUS CODE - 409
      ✔ Rejeitar placa duplicada
    EDGE-CASES
      ✔ Rejeitar ano como número decimal (float)
      ✔ Rejeitar ano como string numérica
      ✔ Rejeitar preco como string numérica
      ✔ Rejeitar marca como string vazia
      ✔ Rejeitar modelo como string vazia
      ✔ Rejeitar placa com letras minúsculas no formato antigo
      ✔ Rejeitar corpo completamente vazio
      ✔ Rejeitar preco como NaN
      ✔ Rejeitar preco como Infinity
      ✔ Rejeitar marca como número
      ✔ Rejeitar modelo como número
    big-inputs
      ✔ Rejeitar marca com mais de 100 caracteres
      ✔ Rejeitar modelo com mais de 100 caracteres
      ✔ Aceitar marca com exatamente 100 caracteres
      ✔ Aceitar modelo com exatamente 100 caracteres

  36 passing (Xms)
```

### Test configuration

The test runner is configured in `.mocharc.yml`:

```yaml
spec: tests/**/*.test.js
timeout: 1000
```

> **Note:** The API uses in-memory storage. Tests share the same app instance, so each test uses a unique plate value to avoid conflicts between test runs. No `beforeEach` reset is needed.

---

## Plate Format Reference

| Format   | Pattern     | Example     |
|----------|-------------|-------------|
| Old      | `AAA-0000`  | `ABC-1234`  |
| Mercosul | `AAA0A00`   | `ABC1D23`   |

Rules: all letters must be **uppercase**; the hyphen is required only in the old format.
