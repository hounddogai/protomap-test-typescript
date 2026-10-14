import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyRedemptionDigest } from "./legacy-redemption-digest.js";

/** Keeps legacy redemption digests by code. */
export interface LegacyRedemptionDigestStore {
  find(code: string): LegacyRedemptionDigest | undefined;
  save(item: LegacyRedemptionDigest): void;
  remove(code: string): boolean;
  list(): LegacyRedemptionDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyRedemptionDigestStore implements LegacyRedemptionDigestStore {
  items: Map<string, LegacyRedemptionDigest>;
  order: string[];

  constructor(items: Map<string, LegacyRedemptionDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyRedemptionDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyRedemptionDigest): void {
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

  list(): LegacyRedemptionDigest[] {
    const out: LegacyRedemptionDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyRedemptionDigestStore(): LegacyRedemptionDigestStore {
  return new MemoryLegacyRedemptionDigestStore(new Map<string, LegacyRedemptionDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyRedemptionDigestStore implements LegacyRedemptionDigestStore {
  inner: LegacyRedemptionDigestStore;
  cache: cache.TtlCache<LegacyRedemptionDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyRedemptionDigestStore,
    cacheValue: cache.TtlCache<LegacyRedemptionDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyRedemptionDigest | undefined {
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

  save(item: LegacyRedemptionDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyRedemptionDigest[] {
    return this.inner.list();
  }
}

export function newCachedLegacyRedemptionDigestStore(inner: LegacyRedemptionDigestStore, ttl: number, clockValue: clock.Clock): LegacyRedemptionDigestStore {
  return new CachedLegacyRedemptionDigestStore(
    inner,
    cache.newTtlCache<LegacyRedemptionDigest>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy redemption digests. Empty fields match all. */
export class LegacyRedemptionDigestQuery {
  label: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minOpenRate: number, statuses: string[], limit: number) {
    this.label = label;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyRedemptionDigest): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyRedemptionDigest[]): LegacyRedemptionDigest[] {
    const matched = collections.filter(items, (candidate: LegacyRedemptionDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyRedemptionDigests(store: LegacyRedemptionDigestStore, query: LegacyRedemptionDigestQuery): LegacyRedemptionDigest[] {
  return query.apply(store.list());
}
