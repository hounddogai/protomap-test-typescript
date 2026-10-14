import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreativeTier } from "./creative-tier.js";

/** Keeps creative tiers by code. */
export interface CreativeTierStore {
  find(code: string): CreativeTier | undefined;
  save(item: CreativeTier): void;
  remove(code: string): boolean;
  list(): CreativeTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreativeTierStore implements CreativeTierStore {
  items: Map<string, CreativeTier>;
  order: string[];

  constructor(items: Map<string, CreativeTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreativeTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreativeTier): void {
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

  list(): CreativeTier[] {
    const out: CreativeTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreativeTierStore(): CreativeTierStore {
  return new MemoryCreativeTierStore(new Map<string, CreativeTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreativeTierStore implements CreativeTierStore {
  inner: CreativeTierStore;
  cache: cache.TtlCache<CreativeTier>;
  hits: number;
  misses: number;

  constructor(inner: CreativeTierStore, cacheValue: cache.TtlCache<CreativeTier>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreativeTier | undefined {
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

  save(item: CreativeTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreativeTier[] {
    return this.inner.list();
  }
}

export function newCachedCreativeTierStore(inner: CreativeTierStore, ttl: number, clockValue: clock.Clock): CreativeTierStore {
  return new CachedCreativeTierStore(inner, cache.newTtlCache<CreativeTier>(256, ttl, clockValue), 0, 0);
}

/** Selects creative tiers. Empty fields match all. */
export class CreativeTierQuery {
  locale: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minAmount: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreativeTier): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreativeTier[]): CreativeTier[] {
    const matched = collections.filter(items, (candidate: CreativeTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreativeTiers(store: CreativeTierStore, query: CreativeTierQuery): CreativeTier[] {
  return query.apply(store.list());
}
