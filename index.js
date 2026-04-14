const express = require('express');
const cors    = require('cors');
const fetch   = (...args) => import('node-fetch').then(({default: f}) => f(...args));

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Health check
app.get('/', (req, res) => res.json({ status: 'GH Buffer Proxy running' }));

// POST /publish — queue a post to one or more Buffer channels
// Body: { token, profile_ids: [...], text, imageUrl? }
app.post('/publish', async (req, res) => {
  const { token, profile_ids, text, imageUrl } = req.body;

  if (!token || !profile_ids?.length || !text) {
    return res.status(400).json({ error: 'Missing token, profile_ids, or text' });
  }

  try {
    const params = new URLSearchParams();
    params.append('access_token', token);
    params.append('text', text);
    profile_ids.forEach(id => params.append('profile_ids[]', id));
    if (imageUrl) {
      params.append('media[photo]', imageUrl);
      params.append('media[thumbnail]', imageUrl);
    }

    const resp = await fetch('https://api.bufferapp.com/1/updates/create.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await resp.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /profiles — fetch Buffer channel list
app.get('/profiles', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Missing token' });
  try {
    const resp = await fetch(`https://api.bufferapp.com/1/profiles.json?access_token=${token}`);
    const data = await resp.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`GH Buffer Proxy listening on port ${PORT}`));
