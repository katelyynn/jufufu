import {createHash} from 'crypto'

export default async function handler(req, res) {
    // cors preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('access-control-allow-origin', '*');
        res.setHeader('access-control-allow-methods', 'POST,OPTIONS');
        res.setHeader('access-control-allow-headers', 'content-type');
        res.status(204).end();
        return;
    }

    if (req.method !== 'POST') {
        res.setHeader('allow', 'POST,OPTIONS');
        res.status(405).json({error: 'method not allowed'});
        return;
    }

    res.setHeader('access-control-allow-origin', '*');

    const {method, params} = req.body;
    const apiKey = process.env.LASTFM_API_KEY;
    const apiSecret = process.env.LASTFM_API_SECRET;

    const allParams = {method, api_key: apiKey, ...params};
    const sigBase = Object.keys(allParams)
        .sort()
        .map(k => k + allParams[k])
        .join('') + apiSecret;
    const api_sig = createHash('md5')
        .update(sigBase, 'utf8')
        .digest('hex');

    const body = new URLSearchParams({...allParams, api_sig, format: 'json'});
    const response = await fetch('http://ws.audioscrobbler.com/2.0/', {
        method: 'POST',
        body
    });

    const data = await response.json();
    res.status(response.ok ? 200 : 502).json(data);
}
