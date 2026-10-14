import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedMentionCycle } from "./weighted-mention-cycle.js";

/** Keeps weighted mention cycles by code. */
export interface WeightedMentionCycleStore {
  find(code: string): WeightedMentionCycle | undefined;
  save(item: WeightedMentionCycle): void;
  remove(code: string): boolean;
  list(): WeightedMentionCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedMentionCycleStore implements WeightedMentionCycleStore {
  items: Map<string, WeightedMentionCycle>;
  order: string[];

  constructor(items: Map<string, WeightedMentionCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedMentionCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedMentionCycle): void {
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

  list(): WeightedMentionCycle[] {
    const out: WeightedMentionCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedMentionCycleStore(): WeightedMentionCycleStore {
  return new MemoryWeightedMentionCycleStore(new Map<string, WeightedMentionCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedMentionCycleStore implements WeightedMentionCycleStore {
  inner: WeightedMentionCycleStore;
  cache: cache.TtlCache<WeightedMentionCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedMentionCycleStore,
    cacheValue: cache.TtlCache<WeightedMentionCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedMentionCycle | undefined {
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

  save(item: WeightedMentionCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedMentionCycle[] {
    return this.inner.list();
  }
}

export function newCachedWeightedMentionCycleStore(inner: WeightedMentionCycleStore, ttl: number, clockValue: clock.Clock): WeightedMentionCycleStore {
  return new CachedWeightedMentionCycleStore(
    inner,
    cache.newTtlCache<WeightedMentionCycle>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted mention cycles. Empty fields match all. */
export class WeightedMentionCycleQuery {
  source: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minThreshold: number, statuses: string[], limit: number) {
    this.source = source;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedMentionCycle): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedMentionCycle[]): WeightedMentionCycle[] {
    const matched = collections.filter(items, (candidate: WeightedMentionCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedMentionCycles(store: WeightedMentionCycleStore, query: WeightedMentionCycleQuery): WeightedMentionCycle[] {
  return query.apply(store.list());
}
