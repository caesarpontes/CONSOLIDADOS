// Vercel Serverless Function: Consulta ao vivo a lista de imóveis à venda da Caixa (RJ)
// Endpoint: GET /api/caixa-rj
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=60');
  try {
    const url = `https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_RJ.csv?t=${Date.now()}`;
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36'
      }
    });
    if (!resp.ok) {
      return res.status(200).json({ ok: false, status: resp.status, items: [] });
    }
    const buf = await resp.arrayBuffer();
    const txt = new TextDecoder('windows-1252').decode(buf);
    const lines = txt.split(/\r?\n/);
    const headerDate = (lines[0] || '').split(';')[3] || '';
    const parseMoney = s => {
      if (!s) return null;
      const v = parseFloat(String(s).replace(/\./g, '').replace(',', '.'));
      return isNaN(v) ? null : v;
    };
    const items = [];
    for (let i = 2; i < lines.length; i++) {
      const l = lines[i];
      if (!l || !l.includes(';RIO DE JANEIRO')) continue;
      const c = l.split(';').map(s => s.trim());
      const id = (c[0] || '').replace(/\D/g, '');
      if (id.length < 10) continue;
      items.push({
        id,
        b: c[3],
        e: c[4],
        pr: parseMoney(c[5]),
        av: parseMoney(c[6]),
        ds: parseFloat(c[7]) || 0,
        fn: c[8],
        de: c[9],
        md: c[10]
      });
    }
    return res.status(200).json({
      ok: true,
      checkedAt: new Date().toISOString(),
      dataListaCaixa: headerDate.trim(),
      totalRio: items.length,
      items
    });
  } catch (err) {
    return res.status(200).json({ ok: false, error: String(err.message || err), items: [] });
  }
}
