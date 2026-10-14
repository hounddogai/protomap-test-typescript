import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FrequencyDigest } from "./frequency-digest.js";

/** Keeps frequency digests by code. */
export interface FrequencyDigestStore {
  find(code: string): FrequencyDigest | undefined;
  save(item: FrequencyDigest): void;
  remove(code: string): boolean;
  list(): FrequencyDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFrequencyDigestStore implements FrequencyDigestStore {
  items: Map<string, FrequencyDigest>;
  order: string[];

  constructor(items: Map<string, FrequencyDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FrequencyDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FrequencyDigest): void {
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

  list(): FrequencyDigest[] {
    const out: FrequencyDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFrequencyDigestStore(): FrequencyDigestStore {
  return new MemoryFrequencyDigestStore(new Map<string, FrequencyDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFrequencyDigestStore implements FrequencyDigestStore {
  inner: FrequencyDigestStore;
  cache: cache.TtlCache<FrequencyDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: FrequencyDigestStore,
    cacheValue: cache.TtlCache<FrequencyDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FrequencyDigest | undefined {
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

  save(item: FrequencyDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FrequencyDigest[] {
    return this.inner.list();
  }
}

export function newCachedFrequencyDigestStore(inner: FrequencyDigestStore, ttl: number, clockValue: clock.Clock): FrequencyDigestStore {
  return new CachedFrequencyDigestStore(inner, cache.newTtlCache<FrequencyDigest>(128, ttl, clockValue), 0, 0);
}

/** Selects frequency digests. Empty fields match all. */
export class FrequencyDigestQuery {
  unit: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minBatchSize: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FrequencyDigest): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FrequencyDigest[]): FrequencyDigest[] {
    const matched = collections.filter(items, (candidate: FrequencyDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFrequencyDigests(store: FrequencyDigestStore, query: FrequencyDigestQuery): FrequencyDigest[] {
  return query.apply(store.list());
}
