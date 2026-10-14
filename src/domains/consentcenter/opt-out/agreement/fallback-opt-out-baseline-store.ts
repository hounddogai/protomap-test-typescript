import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackOptOutBaseline } from "./fallback-opt-out-baseline.js";

/** Keeps fallback opt out baselines by code. */
export interface FallbackOptOutBaselineStore {
  find(code: string): FallbackOptOutBaseline | undefined;
  save(item: FallbackOptOutBaseline): void;
  remove(code: string): boolean;
  list(): FallbackOptOutBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackOptOutBaselineStore implements FallbackOptOutBaselineStore {
  items: Map<string, FallbackOptOutBaseline>;
  order: string[];

  constructor(items: Map<string, FallbackOptOutBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackOptOutBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackOptOutBaseline): void {
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

  list(): FallbackOptOutBaseline[] {
    const out: FallbackOptOutBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackOptOutBaselineStore(): FallbackOptOutBaselineStore {
  return new MemoryFallbackOptOutBaselineStore(new Map<string, FallbackOptOutBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackOptOutBaselineStore implements FallbackOptOutBaselineStore {
  inner: FallbackOptOutBaselineStore;
  cache: cache.TtlCache<FallbackOptOutBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackOptOutBaselineStore,
    cacheValue: cache.TtlCache<FallbackOptOutBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackOptOutBaseline | undefined {
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

  save(item: FallbackOptOutBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackOptOutBaseline[] {
    return this.inner.list();
  }
}

export function newCachedFallbackOptOutBaselineStore(inner: FallbackOptOutBaselineStore, ttl: number, clockValue: clock.Clock): FallbackOptOutBaselineStore {
  return new CachedFallbackOptOutBaselineStore(
    inner,
    cache.newTtlCache<FallbackOptOutBaseline>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback opt out baselines. Empty fields match all. */
export class FallbackOptOutBaselineQuery {
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

  matches(item: FallbackOptOutBaseline): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackOptOutBaseline[]): FallbackOptOutBaseline[] {
    const matched = collections.filter(items, (candidate: FallbackOptOutBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackOptOutBaselines(store: FallbackOptOutBaselineStore, query: FallbackOptOutBaselineQuery): FallbackOptOutBaseline[] {
  return query.apply(store.list());
}
