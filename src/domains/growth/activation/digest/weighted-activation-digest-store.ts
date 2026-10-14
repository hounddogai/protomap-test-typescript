import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedActivationDigest } from "./weighted-activation-digest.js";

/** Keeps weighted activation digests by code. */
export interface WeightedActivationDigestStore {
  find(code: string): WeightedActivationDigest | undefined;
  save(item: WeightedActivationDigest): void;
  remove(code: string): boolean;
  list(): WeightedActivationDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedActivationDigestStore implements WeightedActivationDigestStore {
  items: Map<string, WeightedActivationDigest>;
  order: string[];

  constructor(items: Map<string, WeightedActivationDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedActivationDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedActivationDigest): void {
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

  list(): WeightedActivationDigest[] {
    const out: WeightedActivationDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedActivationDigestStore(): WeightedActivationDigestStore {
  return new MemoryWeightedActivationDigestStore(new Map<string, WeightedActivationDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedActivationDigestStore implements WeightedActivationDigestStore {
  inner: WeightedActivationDigestStore;
  cache: cache.TtlCache<WeightedActivationDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedActivationDigestStore,
    cacheValue: cache.TtlCache<WeightedActivationDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedActivationDigest | undefined {
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

  save(item: WeightedActivationDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedActivationDigest[] {
    return this.inner.list();
  }
}

export function newCachedWeightedActivationDigestStore(inner: WeightedActivationDigestStore, ttl: number, clockValue: clock.Clock): WeightedActivationDigestStore {
  return new CachedWeightedActivationDigestStore(
    inner,
    cache.newTtlCache<WeightedActivationDigest>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted activation digests. Empty fields match all. */
export class WeightedActivationDigestQuery {
  channel: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minAttempts: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedActivationDigest): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedActivationDigest[]): WeightedActivationDigest[] {
    const matched = collections.filter(items, (candidate: WeightedActivationDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedActivationDigests(store: WeightedActivationDigestStore, query: WeightedActivationDigestQuery): WeightedActivationDigest[] {
  return query.apply(store.list());
}
