jest.mock('axios');
const mockedAxios = require('axios');

const request = require('supertest');
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Mock de los precios de mercado
const mockTickers = {
  tickers: [
    { market_id: 'BTC-CLP', last_price: ['10000000.0', 'CLP'] },
    { market_id: 'ETH-CLP', last_price: ['2000000.0', 'CLP'] },
    { market_id: 'USDT-CLP', last_price: ['900.0', 'CLP'] }
  ]
};

const marketMap = {
  'BTC-CLP': true,
  'ETH-CLP': true,
  'USDT-CLP': true
};

app.post('/api/portfolio-value', async (req, res) => {
  const { portfolio, fiat_currency } = req.body;

  if (!portfolio || typeof portfolio !== 'object' || !fiat_currency) {
    return res.status(400).json({ error: 'Missing or invalid portfolio or fiat_currency' });
  }

  try {
    const { data } = await axios.get('https://www.buda.com/api/v2/markets/tickers');
    const tickers = data.tickers;

    let total = 0;

    for (const [crypto, amount] of Object.entries(portfolio)) {
      const market_id = `${crypto.toUpperCase()}-${fiat_currency.toUpperCase()}`;

      if (!marketMap[market_id]) continue;

      const ticker = tickers.find(t => t.market_id === market_id);
      if (!ticker) continue;

      const price = parseFloat(ticker.last_price[0]);
      total += price * amount;
    }

    res.json({ total, currency: fiat_currency });
  } catch (error) {
    res.status(500).json({ error: 'Error calculando valor del portafolio' });
  }
});

describe('POST /api/portfolio-value', () => {
  it('debe calcular correctamente el valor del portafolio', async () => {
	mockedAxios.get.mockResolvedValueOnce({ data: mockTickers });

    const response = await request(app).post('/api/portfolio-value').send({
      portfolio: { BTC: 0.5, ETH: 2, USDT: 1000 },
      fiat_currency: 'CLP'
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.total).toBeCloseTo(
      (0.5 * 10000000) + (2 * 2000000) + (1000 * 900), 2
    );
    expect(response.body.currency).toBe('CLP');
  });

  it('debe retornar 400 si falta data', async () => {
    const response = await request(app).post('/api/portfolio-value').send({});
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBeDefined();
  });
});
