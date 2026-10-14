import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WarmupCycle } from "./warmup-cycle.js";

/** Keeps warmup cycles by code. */
export interface WarmupCycleStore {
  find(code: string): WarmupCycle | undefined;
  save(item: WarmupCycle): void;
  remove(code: string): boolean;
  list(): WarmupCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWarmupCycleStore implements WarmupCycleStore {
  items: Map<string, WarmupCycle>;
  order: string[];

  constructor(items: Map<string, WarmupCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WarmupCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WarmupCycle): void {
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

  list(): WarmupCycle[] {
    const out: WarmupCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWarmupCycleStore(): WarmupCycleStore {
  return new MemoryWarmupCycleStore(new Map<string, WarmupCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWarmupCycleStore implements WarmupCycleStore {
  inner: WarmupCycleStore;
  cache: cache.TtlCache<WarmupCycle>;
  hits: number;
  misses: number;

  constructor(inner: WarmupCycleStore, cacheValue: cache.TtlCache<WarmupCycle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WarmupCycle | undefined {
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

  save(item: WarmupCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WarmupCycle[] {
    return this.inner.list();
  }
}

export function newCachedWarmupCycleStore(inner: WarmupCycleStore, ttl: number, clockValue: clock.Clock): WarmupCycleStore {
  return new CachedWarmupCycleStore(inner, cache.newTtlCache<WarmupCycle>(1024, ttl, clockValue), 0, 0);
}

/** Selects warmup cycles. Empty fields match all. */
export class WarmupCycleQuery {
  source: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.source = source;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WarmupCycle): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WarmupCycle[]): WarmupCycle[] {
    const matched = collections.filter(items, (candidate: WarmupCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWarmupCycles(store: WarmupCycleStore, query: WarmupCycleQuery): WarmupCycle[] {
  return query.apply(store.list());
}
