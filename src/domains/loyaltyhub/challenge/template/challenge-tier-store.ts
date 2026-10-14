import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ChallengeTier } from "./challenge-tier.js";

/** Keeps challenge tiers by code. */
export interface ChallengeTierStore {
  find(code: string): ChallengeTier | undefined;
  save(item: ChallengeTier): void;
  remove(code: string): boolean;
  list(): ChallengeTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryChallengeTierStore implements ChallengeTierStore {
  items: Map<string, ChallengeTier>;
  order: string[];

  constructor(items: Map<string, ChallengeTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ChallengeTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ChallengeTier): void {
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

  list(): ChallengeTier[] {
    const out: ChallengeTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryChallengeTierStore(): ChallengeTierStore {
  return new MemoryChallengeTierStore(new Map<string, ChallengeTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedChallengeTierStore implements ChallengeTierStore {
  inner: ChallengeTierStore;
  cache: cache.TtlCache<ChallengeTier>;
  hits: number;
  misses: number;

  constructor(inner: ChallengeTierStore, cacheValue: cache.TtlCache<ChallengeTier>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ChallengeTier | undefined {
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

  save(item: ChallengeTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ChallengeTier[] {
    return this.inner.list();
  }
}

export function newCachedChallengeTierStore(inner: ChallengeTierStore, ttl: number, clockValue: clock.Clock): ChallengeTierStore {
  return new CachedChallengeTierStore(inner, cache.newTtlCache<ChallengeTier>(1024, ttl, clockValue), 0, 0);
}

/** Selects challenge tiers. Empty fields match all. */
export class ChallengeTierQuery {
  label: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minAmount: number, statuses: string[], limit: number) {
    this.label = label;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ChallengeTier): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ChallengeTier[]): ChallengeTier[] {
    const matched = collections.filter(items, (candidate: ChallengeTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findChallengeTiers(store: ChallengeTierStore, query: ChallengeTierQuery): ChallengeTier[] {
  return query.apply(store.list());
}
