import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DeflectionCycle } from "./deflection-cycle.js";

/** Keeps deflection cycles by code. */
export interface DeflectionCycleStore {
  find(code: string): DeflectionCycle | undefined;
  save(item: DeflectionCycle): void;
  remove(code: string): boolean;
  list(): DeflectionCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDeflectionCycleStore implements DeflectionCycleStore {
  items: Map<string, DeflectionCycle>;
  order: string[];

  constructor(items: Map<string, DeflectionCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DeflectionCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DeflectionCycle): void {
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

  list(): DeflectionCycle[] {
    const out: DeflectionCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDeflectionCycleStore(): DeflectionCycleStore {
  return new MemoryDeflectionCycleStore(new Map<string, DeflectionCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDeflectionCycleStore implements DeflectionCycleStore {
  inner: DeflectionCycleStore;
  cache: cache.TtlCache<DeflectionCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: DeflectionCycleStore,
    cacheValue: cache.TtlCache<DeflectionCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DeflectionCycle | undefined {
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

  save(item: DeflectionCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DeflectionCycle[] {
    return this.inner.list();
  }
}

export function newCachedDeflectionCycleStore(inner: DeflectionCycleStore, ttl: number, clockValue: clock.Clock): DeflectionCycleStore {
  return new CachedDeflectionCycleStore(inner, cache.newTtlCache<DeflectionCycle>(128, ttl, clockValue), 0, 0);
}

/** Selects deflection cycles. Empty fields match all. */
export class DeflectionCycleQuery {
  channel: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minMargin: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DeflectionCycle): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DeflectionCycle[]): DeflectionCycle[] {
    const matched = collections.filter(items, (candidate: DeflectionCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDeflectionCycles(store: DeflectionCycleStore, query: DeflectionCycleQuery): DeflectionCycle[] {
  return query.apply(store.list());
}
