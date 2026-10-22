/** Consulta Google Safe Browsing. Devuelve las URLs reportadas como peligrosas. */
export async function checkSafeBrowsing(urls: string[]): Promise<Set<string>> {
  const key = process.env.SAFE_BROWSING_API_KEY;
  if (!key || urls.length === 0) return new Set();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const res = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        signal: ctrl.signal,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          client: { clientId: "verifica-santa-fe", clientVersion: "1.0" },
          threatInfo: {
            threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: urls.map((url) => ({ url })),
          },
        }),
      },
    );
    if (!res.ok) return new Set();
    const data = (await res.json()) as { matches?: { threat: { url: string } }[] };
    return new Set((data.matches ?? []).map((m) => m.threat.url));
  } catch {
    return new Set();
  } finally {
    clearTimeout(timer);
  }
}
