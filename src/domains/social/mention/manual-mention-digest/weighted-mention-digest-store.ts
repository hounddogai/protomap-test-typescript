import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedMentionDigest } from "./weighted-mention-digest.js";

/** Keeps weighted mention digests by code. */
export interface WeightedMentionDigestStore {
  find(code: string): WeightedMentionDigest | undefined;
  save(item: WeightedMentionDigest): void;
  remove(code: string): boolean;
  list(): WeightedMentionDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedMentionDigestStore implements WeightedMentionDigestStore {
  items: Map<string, WeightedMentionDigest>;
  order: string[];

  constructor(items: Map<string, WeightedMentionDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedMentionDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedMentionDigest): void {
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

  list(): WeightedMentionDigest[] {
    const out: WeightedMentionDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedMentionDigestStore(): WeightedMentionDigestStore {
  return new MemoryWeightedMentionDigestStore(new Map<string, WeightedMentionDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedMentionDigestStore implements WeightedMentionDigestStore {
  inner: WeightedMentionDigestStore;
  cache: cache.TtlCache<WeightedMentionDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedMentionDigestStore,
    cacheValue: cache.TtlCache<WeightedMentionDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedMentionDigest | undefined {
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

  save(item: WeightedMentionDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedMentionDigest[] {
    return this.inner.list();
  }
}

export function newCachedWeightedMentionDigestStore(inner: WeightedMentionDigestStore, ttl: number, clockValue: clock.Clock): WeightedMentionDigestStore {
  return new CachedWeightedMentionDigestStore(
    inner,
    cache.newTtlCache<WeightedMentionDigest>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted mention digests. Empty fields match all. */
export class WeightedMentionDigestQuery {
  title: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCeiling: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedMentionDigest): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedMentionDigest[]): WeightedMentionDigest[] {
    const matched = collections.filter(items, (candidate: WeightedMentionDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedMentionDigests(store: WeightedMentionDigestStore, query: WeightedMentionDigestQuery): WeightedMentionDigest[] {
  return query.apply(store.list());
}
