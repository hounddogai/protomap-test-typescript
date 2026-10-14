import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackExitRuleCycle } from "./fallback-exit-rule-cycle.js";

/** Keeps fallback exit rule cycles by code. */
export interface FallbackExitRuleCycleStore {
  find(code: string): FallbackExitRuleCycle | undefined;
  save(item: FallbackExitRuleCycle): void;
  remove(code: string): boolean;
  list(): FallbackExitRuleCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackExitRuleCycleStore implements FallbackExitRuleCycleStore {
  items: Map<string, FallbackExitRuleCycle>;
  order: string[];

  constructor(items: Map<string, FallbackExitRuleCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackExitRuleCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackExitRuleCycle): void {
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

  list(): FallbackExitRuleCycle[] {
    const out: FallbackExitRuleCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackExitRuleCycleStore(): FallbackExitRuleCycleStore {
  return new MemoryFallbackExitRuleCycleStore(new Map<string, FallbackExitRuleCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackExitRuleCycleStore implements FallbackExitRuleCycleStore {
  inner: FallbackExitRuleCycleStore;
  cache: cache.TtlCache<FallbackExitRuleCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackExitRuleCycleStore,
    cacheValue: cache.TtlCache<FallbackExitRuleCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackExitRuleCycle | undefined {
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

  save(item: FallbackExitRuleCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackExitRuleCycle[] {
    return this.inner.list();
  }
}

export function newCachedFallbackExitRuleCycleStore(inner: FallbackExitRuleCycleStore, ttl: number, clockValue: clock.Clock): FallbackExitRuleCycleStore {
  return new CachedFallbackExitRuleCycleStore(
    inner,
    cache.newTtlCache<FallbackExitRuleCycle>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback exit rule cycles. Empty fields match all. */
export class FallbackExitRuleCycleQuery {
  category: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minScore: number, statuses: string[], limit: number) {
    this.category = category;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackExitRuleCycle): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackExitRuleCycle[]): FallbackExitRuleCycle[] {
    const matched = collections.filter(items, (candidate: FallbackExitRuleCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackExitRuleCycles(store: FallbackExitRuleCycleStore, query: FallbackExitRuleCycleQuery): FallbackExitRuleCycle[] {
  return query.apply(store.list());
}
