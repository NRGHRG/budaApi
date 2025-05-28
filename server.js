// server.js (versión optimizada con soporte para ES Modules y Jest)
import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let marketMap = {};

const fetchMarketData = async () => {
  try {
    const res = await axios.get('https://www.buda.com/api/v2/markets');
    marketMap = res.data.markets.reduce((acc, market) => {
      acc[market.id] = true;
      return acc;
    }, {});
    console.log('Mercados disponibles:', Object.keys(marketMap));
  } catch (error) {
    console.error('Error fetching market list:', error.message);
  }
};

const getMarketPrice = async (market_id) => {
  try {
    const res = await axios.get(`https://www.buda.com/api/v2/markets/${market_id}/ticker.json`);
    return parseFloat(res.data.ticker.last_price[0]);
  } catch (error) {
    console.warn(`No se pudo obtener precio para ${market_id}:`, error.message);
    return null;
  }
};

app.post('/api/portfolio-value', async (req, res) => {
  const { portfolio, fiat_currency } = req.body;

  if (!portfolio || typeof portfolio !== 'object' || !fiat_currency) {
    return res.status(400).json({ error: 'Missing or invalid portfolio or fiat_currency' });
  }

  try {
    let total = 0;
    const startTime = Date.now();

    for (const [crypto, amount] of Object.entries(portfolio)) {
      if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
        console.warn(`Cantidad inválida para ${crypto}:`, amount);
        continue;
      }

      const market_id = `${crypto.toUpperCase()}-${fiat_currency.toUpperCase()}`;

      if (!marketMap[market_id]) {
        console.warn(`Market ${market_id} no disponible`);
        continue;
      }

      const price = await getMarketPrice(market_id);
      if (price === null) continue;

      total += price * amount;
    }

    const duration = Date.now() - startTime;
    console.log(`Portafolio calculado en ${duration}ms, total: ${total.toFixed(2)} ${fiat_currency}`);

    res.json({ total, currency: fiat_currency });
  } catch (error) {
    console.error('Error calculando valor del portafolio:', error.message);
    res.status(500).json({ error: 'Error calculando valor del portafolio' });
  }
});

app.get('/api/ticker/:market', async (req, res) => {
  const { market } = req.params;

  try {
    const { data } = await axios.get(`https://www.buda.com/api/v2/markets/${market.toUpperCase()}/ticker.json`);
    res.json(data.ticker);
  } catch (error) {
    console.error(`Error obteniendo ticker para ${market}:`, error.message);
    res.status(500).json({ error: `No se pudo obtener el ticker para ${market}` });
  }
});

fetchMarketData().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
});

export default app;
