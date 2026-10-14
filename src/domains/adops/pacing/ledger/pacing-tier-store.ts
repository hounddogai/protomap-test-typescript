import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PacingTier } from "./pacing-tier.js";

/** Keeps pacing tiers by code. */
export interface PacingTierStore {
  find(code: string): PacingTier | undefined;
  save(item: PacingTier): void;
  remove(code: string): boolean;
  list(): PacingTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPacingTierStore implements PacingTierStore {
  items: Map<string, PacingTier>;
  order: string[];

  constructor(items: Map<string, PacingTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PacingTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PacingTier): void {
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

  list(): PacingTier[] {
    const out: PacingTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPacingTierStore(): PacingTierStore {
  return new MemoryPacingTierStore(new Map<string, PacingTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPacingTierStore implements PacingTierStore {
  inner: PacingTierStore;
  cache: cache.TtlCache<PacingTier>;
  hits: number;
  misses: number;

  constructor(inner: PacingTierStore, cacheValue: cache.TtlCache<PacingTier>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PacingTier | undefined {
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

  save(item: PacingTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PacingTier[] {
    return this.inner.list();
  }
}

export function newCachedPacingTierStore(inner: PacingTierStore, ttl: number, clockValue: clock.Clock): PacingTierStore {
  return new CachedPacingTierStore(inner, cache.newTtlCache<PacingTier>(1024, ttl, clockValue), 0, 0);
}

/** Selects pacing tiers. Empty fields match all. */
export class PacingTierQuery {
  label: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minDiscount: number, statuses: string[], limit: number) {
    this.label = label;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PacingTier): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PacingTier[]): PacingTier[] {
    const matched = collections.filter(items, (candidate: PacingTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPacingTiers(store: PacingTierStore, query: PacingTierQuery): PacingTier[] {
  return query.apply(store.list());
}
