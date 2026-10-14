import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveFrequencyDigest } from "./adaptive-frequency-digest.js";

/** Keeps adaptive frequency digests by code. */
export interface AdaptiveFrequencyDigestStore {
  find(code: string): AdaptiveFrequencyDigest | undefined;
  save(item: AdaptiveFrequencyDigest): void;
  remove(code: string): boolean;
  list(): AdaptiveFrequencyDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveFrequencyDigestStore implements AdaptiveFrequencyDigestStore {
  items: Map<string, AdaptiveFrequencyDigest>;
  order: string[];

  constructor(items: Map<string, AdaptiveFrequencyDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveFrequencyDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveFrequencyDigest): void {
    if (!this.items.has(item.code)) {
      this.order.push(item.code);
    }
    this.items.set(item.code, item);
  }

  remove(code: string): boolean {
    if (!this.items.has(code)) return false;
    this.items.delete(code);
    const kept: string[] = [];
    for (const existing of this.order) {
      if (existing !== code) {
        kept.push(existing);
      }
    }
    this.order = kept;
    return true;
  }

  list(): AdaptiveFrequencyDigest[] {
    const out: AdaptiveFrequencyDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveFrequencyDigestStore(): AdaptiveFrequencyDigestStore {
  return new MemoryAdaptiveFrequencyDigestStore(new Map<string, AdaptiveFrequencyDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveFrequencyDigestStore implements AdaptiveFrequencyDigestStore {
  inner: AdaptiveFrequencyDigestStore;
  cache: cache.TtlCache<AdaptiveFrequencyDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveFrequencyDigestStore,
    cacheValue: cache.TtlCache<AdaptiveFrequencyDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveFrequencyDigest | undefined {
    const hit = this.cache.get(code);
    if (hit === undefined) {
      this.misses += 1;
      const found = this.inner.find(code);
      if (found === undefined) return undefined;
      this.cache.put(code, found);
      return found;
    }
    this.hits += 1;
    return hit;
  }

  save(item: AdaptiveFrequencyDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveFrequencyDigest[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveFrequencyDigestStore(inner: AdaptiveFrequencyDigestStore, ttl: number, clockValue: clock.Clock): AdaptiveFrequencyDigestStore {
  return new CachedAdaptiveFrequencyDigestStore(
    inner,
    cache.newTtlCache<AdaptiveFrequencyDigest>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive frequency digests. Empty fields match all. */
export class AdaptiveFrequencyDigestQuery {
  name: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minSequence: number, statuses: string[], limit: number) {
    this.name = name;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveFrequencyDigest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveFrequencyDigest[]): AdaptiveFrequencyDigest[] {
    const matched = collections.filter(items, (candidate: AdaptiveFrequencyDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveFrequencyDigests(store: AdaptiveFrequencyDigestStore, query: AdaptiveFrequencyDigestQuery): AdaptiveFrequencyDigest[] {
  return query.apply(store.list());
}
