import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackCreditTarget } from "./fallback-credit-target.js";

/** Keeps fallback credit targets by code. */
export interface FallbackCreditTargetStore {
  find(code: string): FallbackCreditTarget | undefined;
  save(item: FallbackCreditTarget): void;
  remove(code: string): boolean;
  list(): FallbackCreditTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackCreditTargetStore implements FallbackCreditTargetStore {
  items: Map<string, FallbackCreditTarget>;
  order: string[];

  constructor(items: Map<string, FallbackCreditTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackCreditTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackCreditTarget): void {
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

  list(): FallbackCreditTarget[] {
    const out: FallbackCreditTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackCreditTargetStore(): FallbackCreditTargetStore {
  return new MemoryFallbackCreditTargetStore(new Map<string, FallbackCreditTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackCreditTargetStore implements FallbackCreditTargetStore {
  inner: FallbackCreditTargetStore;
  cache: cache.TtlCache<FallbackCreditTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackCreditTargetStore,
    cacheValue: cache.TtlCache<FallbackCreditTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackCreditTarget | undefined {
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

  save(item: FallbackCreditTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackCreditTarget[] {
    return this.inner.list();
  }
}

export function newCachedFallbackCreditTargetStore(inner: FallbackCreditTargetStore, ttl: number, clockValue: clock.Clock): FallbackCreditTargetStore {
  return new CachedFallbackCreditTargetStore(
    inner,
    cache.newTtlCache<FallbackCreditTarget>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback credit targets. Empty fields match all. */
export class FallbackCreditTargetQuery {
  name: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackCreditTarget): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackCreditTarget[]): FallbackCreditTarget[] {
    const matched = collections.filter(items, (candidate: FallbackCreditTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackCreditTargets(store: FallbackCreditTargetStore, query: FallbackCreditTargetQuery): FallbackCreditTarget[] {
  return query.apply(store.list());
}
