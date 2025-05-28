# 📊 Buda.com Crypto Portfolio API

Este proyecto es una REST API construida en **Node.js + Express** que calcula el valor de un portafolio de criptomonedas usando precios reales desde la [API pública de Buda.com](https://api.buda.com).

---

## 🚀 Endpoints

### `POST /api/portfolio-value`

Calcula el valor total de un portafolio cripto en la moneda fiat solicitada.

#### 📝 Input (JSON)
```json
{
  "portfolio": {
    "BTC": 0.5,
    "ETH": 2.0,
    "USDT": 1000
  },
  "fiat_currency": "CLP"
}
```

#### ✅ Output (JSON)
```json
{
  "total": 18000000,
  "currency": "CLP"
}
```

---

### `GET /api/ticker/:market`

Consulta el precio actual de un mercado específico (por ejemplo, `btc-clp`).

#### Ejemplo:
`GET /api/ticker/btc-clp`

---

## 🧪 Tests Automatizados

Se incluye un archivo de prueba utilizando **Jest** y **Supertest** para verificar el funcionamiento del endpoint `/api/portfolio-value`.

### ✅ Ejecución
```bash
npm install
npm test
```

### 📄 Ejemplo de test exitoso
```javascript
const request = require('supertest');
const express = require('express');
const axios = require('axios');
jest.mock('axios');

const app = express();
app.use(express.json());

const mockTickers = {
  tickers: [
    { market_id: 'BTC-CLP', last_price: ['10000000.0', 'CLP'] },
    { market_id: 'ETH-CLP', last_price: ['2000000.0', 'CLP'] },
    { market_id: 'USDT-CLP', last_price: ['900.0', 'CLP'] }
  ]
};

app.post('/api/portfolio-value', async (req, res) => {
  const { portfolio, fiat_currency } = req.body;

  if (!portfolio || !fiat_currency) {
    return res.status(400).json({ error: 'Missing portfolio or fiat_currency' });
  }

  const { data } = await axios.get('https://www.buda.com/api/v2/markets/tickers');
  const tickers = data.tickers;

  let total = 0;

  for (const [crypto, amount] of Object.entries(portfolio)) {
    const market_id = `${crypto}-${fiat_currency}`;
    const ticker = tickers.find(t => t.market_id === market_id);
    if (!ticker) continue;

    const price = parseFloat(ticker.last_price[0]);
    total += price * amount;
  }

  res.json({ total, currency: fiat_currency });
});

describe('POST /api/portfolio-value', () => {
  it('debe calcular correctamente el valor del portafolio', async () => {
    axios.get.mockResolvedValueOnce({ data: mockTickers });

    const response = await request(app).post('/api/portfolio-value').send({
      portfolio: { BTC: 0.5, ETH: 2, USDT: 1000 },
      fiat_currency: 'CLP'
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.total).toBeCloseTo(18000000, 2);
    expect(response.body.currency).toBe('CLP');
  });
});
```

---

## 📦 Instalación y ejecución local

```bash
git clone https://github.com/tu_usuario/buda-api.git
cd buda-api
npm install
npm run dev
```

---

## 📌 Supuestos

- El backend sólo usa mercados disponibles en la API pública.
- Si un mercado no existe, se ignora esa moneda sin fallar el proceso.
- Se usan precios `last_price` como referencia de valor actual.

---

## 🧠 Herramientas

- Node.js
- Express
- Axios
- Jest + Supertest
- Buda API pública

---

## 📄 Licencia

MIT License

---

> Proyecto realizado como desafío técnico para Buda.com 🚀
