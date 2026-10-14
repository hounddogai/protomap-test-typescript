import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyRetentionDigest } from "./legacy-retention-digest.js";

/** Keeps legacy retention digests by code. */
export interface LegacyRetentionDigestStore {
  find(code: string): LegacyRetentionDigest | undefined;
  save(item: LegacyRetentionDigest): void;
  remove(code: string): boolean;
  list(): LegacyRetentionDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyRetentionDigestStore implements LegacyRetentionDigestStore {
  items: Map<string, LegacyRetentionDigest>;
  order: string[];

  constructor(items: Map<string, LegacyRetentionDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyRetentionDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyRetentionDigest): void {
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

  list(): LegacyRetentionDigest[] {
    const out: LegacyRetentionDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyRetentionDigestStore(): LegacyRetentionDigestStore {
  return new MemoryLegacyRetentionDigestStore(new Map<string, LegacyRetentionDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyRetentionDigestStore implements LegacyRetentionDigestStore {
  inner: LegacyRetentionDigestStore;
  cache: cache.TtlCache<LegacyRetentionDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyRetentionDigestStore,
    cacheValue: cache.TtlCache<LegacyRetentionDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyRetentionDigest | undefined {
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

  save(item: LegacyRetentionDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyRetentionDigest[] {
    return this.inner.list();
  }
}

export function newCachedLegacyRetentionDigestStore(inner: LegacyRetentionDigestStore, ttl: number, clockValue: clock.Clock): LegacyRetentionDigestStore {
  return new CachedLegacyRetentionDigestStore(
    inner,
    cache.newTtlCache<LegacyRetentionDigest>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy retention digests. Empty fields match all. */
export class LegacyRetentionDigestQuery {
  channel: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRate: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyRetentionDigest): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyRetentionDigest[]): LegacyRetentionDigest[] {
    const matched = collections.filter(items, (candidate: LegacyRetentionDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyRetentionDigests(store: LegacyRetentionDigestStore, query: LegacyRetentionDigestQuery): LegacyRetentionDigest[] {
  return query.apply(store.list());
}
