import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredMacroPolicy } from "./tiered-macro-policy.js";

/** Keeps tiered macro policies by code. */
export interface TieredMacroPolicyStore {
  find(code: string): TieredMacroPolicy | undefined;
  save(item: TieredMacroPolicy): void;
  remove(code: string): boolean;
  list(): TieredMacroPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredMacroPolicyStore implements TieredMacroPolicyStore {
  items: Map<string, TieredMacroPolicy>;
  order: string[];

  constructor(items: Map<string, TieredMacroPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredMacroPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredMacroPolicy): void {
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

  list(): TieredMacroPolicy[] {
    const out: TieredMacroPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredMacroPolicyStore(): TieredMacroPolicyStore {
  return new MemoryTieredMacroPolicyStore(new Map<string, TieredMacroPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredMacroPolicyStore implements TieredMacroPolicyStore {
  inner: TieredMacroPolicyStore;
  cache: cache.TtlCache<TieredMacroPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredMacroPolicyStore,
    cacheValue: cache.TtlCache<TieredMacroPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredMacroPolicy | undefined {
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

  save(item: TieredMacroPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredMacroPolicy[] {
    return this.inner.list();
  }
}

export function newCachedTieredMacroPolicyStore(inner: TieredMacroPolicyStore, ttl: number, clockValue: clock.Clock): TieredMacroPolicyStore {
  return new CachedTieredMacroPolicyStore(inner, cache.newTtlCache<TieredMacroPolicy>(512, ttl, clockValue), 0, 0);
}

/** Selects tiered macro policies. Empty fields match all. */
export class TieredMacroPolicyQuery {
  utmSource: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minRate: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredMacroPolicy): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredMacroPolicy[]): TieredMacroPolicy[] {
    const matched = collections.filter(items, (candidate: TieredMacroPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredMacroPolicies(store: TieredMacroPolicyStore, query: TieredMacroPolicyQuery): TieredMacroPolicy[] {
  return query.apply(store.list());
}
