import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualBadgeTier } from "./manual-badge-tier.js";

/** Keeps manual badge tiers by code. */
export interface ManualBadgeTierStore {
  find(code: string): ManualBadgeTier | undefined;
  save(item: ManualBadgeTier): void;
  remove(code: string): boolean;
  list(): ManualBadgeTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualBadgeTierStore implements ManualBadgeTierStore {
  items: Map<string, ManualBadgeTier>;
  order: string[];

  constructor(items: Map<string, ManualBadgeTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualBadgeTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualBadgeTier): void {
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

  list(): ManualBadgeTier[] {
    const out: ManualBadgeTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualBadgeTierStore(): ManualBadgeTierStore {
  return new MemoryManualBadgeTierStore(new Map<string, ManualBadgeTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualBadgeTierStore implements ManualBadgeTierStore {
  inner: ManualBadgeTierStore;
  cache: cache.TtlCache<ManualBadgeTier>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualBadgeTierStore,
    cacheValue: cache.TtlCache<ManualBadgeTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualBadgeTier | undefined {
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

  save(item: ManualBadgeTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualBadgeTier[] {
    return this.inner.list();
  }
}

export function newCachedManualBadgeTierStore(inner: ManualBadgeTierStore, ttl: number, clockValue: clock.Clock): ManualBadgeTierStore {
  return new CachedManualBadgeTierStore(inner, cache.newTtlCache<ManualBadgeTier>(512, ttl, clockValue), 0, 0);
}

/** Selects manual badge tiers. Empty fields match all. */
export class ManualBadgeTierQuery {
  name: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCeiling: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualBadgeTier): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualBadgeTier[]): ManualBadgeTier[] {
    const matched = collections.filter(items, (candidate: ManualBadgeTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualBadgeTiers(store: ManualBadgeTierStore, query: ManualBadgeTierQuery): ManualBadgeTier[] {
  return query.apply(store.list());
}
