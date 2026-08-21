const RADIO_ORIGIN = 'https://yalacom.github.io/fit-rabota';

export default {
  async fetch(request) {
    const incoming = new URL(request.url);
    const target = new URL(RADIO_ORIGIN + incoming.pathname + incoming.search);
    const upstream = await fetch(new Request(target.toString(), request));
    const headers = new Headers(upstream.headers);
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers
    });
  }
};
