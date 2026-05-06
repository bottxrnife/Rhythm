import { SOLANA_RPC_URL } from '../config/solana';

const SKR_RPC_URL = SOLANA_RPC_URL;
const LOOKUP_TIMEOUT_MS = 5000;

const cache = new Map<string, string | null>();

export async function resolveSkrName(walletAddress: string): Promise<string | null> {
  if (cache.has(walletAddress)) {
    return cache.get(walletAddress) ?? null;
  }

  try {
    const name = await withTimeout(resolveSkrNameFromAllDomains(walletAddress), LOOKUP_TIMEOUT_MS);
    cache.set(walletAddress, name);
    return name;
  } catch (error) {
    console.warn('SKR lookup failed:', error instanceof Error ? error.message : error);
    cache.set(walletAddress, null);
    return null;
  }
}

async function resolveSkrNameFromAllDomains(walletAddress: string): Promise<string | null> {
  const { createSolanaRpc } = await import('@solana/kit');
  const { TldParser } = await import('@onsol/tldparser-kit');
  const rpc = createSolanaRpc(SKR_RPC_URL);
  const parser = new TldParser(rpc as unknown as ConstructorParameters<typeof TldParser>[0]);

  try {
    const mainDomain = await parser.getMainDomain(walletAddress);
    if (mainDomain.tld === '.skr') {
      return `${mainDomain.domain}${mainDomain.tld}`;
    }
  } catch {
    // No primary domain set, or lookup failed. Try owned .skr domains next.
  }

  const ownedSkrDomains = await parser.getParsedAllUserDomainsFromTld(walletAddress, 'skr', 3);
  return ownedSkrDomains[0]?.domain ?? null;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('SKR lookup timed out')), timeoutMs);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeout));
  });
}
