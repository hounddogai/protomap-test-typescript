import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BounceTier } from "./bounce-tier.js";

/** Keeps bounce tiers by code. */
export interface BounceTierStore {
  find(code: string): BounceTier | undefined;
  save(item: BounceTier): void;
  remove(code: string): boolean;
  list(): BounceTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBounceTierStore implements BounceTierStore {
  items: Map<string, BounceTier>;
  order: string[];

  constructor(items: Map<string, BounceTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BounceTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BounceTier): void {
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

  list(): BounceTier[] {
    const out: BounceTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBounceTierStore(): BounceTierStore {
  return new MemoryBounceTierStore(new Map<string, BounceTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBounceTierStore implements BounceTierStore {
  inner: BounceTierStore;
  cache: cache.TtlCache<BounceTier>;
  hits: number;
  misses: number;

  constructor(inner: BounceTierStore, cacheValue: cache.TtlCache<BounceTier>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BounceTier | undefined {
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

  save(item: BounceTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BounceTier[] {
    return this.inner.list();
  }
}

export function newCachedBounceTierStore(inner: BounceTierStore, ttl: number, clockValue: clock.Clock): BounceTierStore {
  return new CachedBounceTierStore(inner, cache.newTtlCache<BounceTier>(1024, ttl, clockValue), 0, 0);
}

/** Selects bounce tiers. Empty fields match all. */
export class BounceTierQuery {
  name: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BounceTier): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BounceTier[]): BounceTier[] {
    const matched = collections.filter(items, (candidate: BounceTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBounceTiers(store: BounceTierStore, query: BounceTierQuery): BounceTier[] {
  return query.apply(store.list());
}
