import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyFlightCycle } from "./legacy-flight-cycle.js";

/** Keeps legacy flight cycles by code. */
export interface LegacyFlightCycleStore {
  find(code: string): LegacyFlightCycle | undefined;
  save(item: LegacyFlightCycle): void;
  remove(code: string): boolean;
  list(): LegacyFlightCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyFlightCycleStore implements LegacyFlightCycleStore {
  items: Map<string, LegacyFlightCycle>;
  order: string[];

  constructor(items: Map<string, LegacyFlightCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyFlightCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyFlightCycle): void {
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

  list(): LegacyFlightCycle[] {
    const out: LegacyFlightCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyFlightCycleStore(): LegacyFlightCycleStore {
  return new MemoryLegacyFlightCycleStore(new Map<string, LegacyFlightCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyFlightCycleStore implements LegacyFlightCycleStore {
  inner: LegacyFlightCycleStore;
  cache: cache.TtlCache<LegacyFlightCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyFlightCycleStore,
    cacheValue: cache.TtlCache<LegacyFlightCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyFlightCycle | undefined {
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

  save(item: LegacyFlightCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyFlightCycle[] {
    return this.inner.list();
  }
}

export function newCachedLegacyFlightCycleStore(inner: LegacyFlightCycleStore, ttl: number, clockValue: clock.Clock): LegacyFlightCycleStore {
  return new CachedLegacyFlightCycleStore(inner, cache.newTtlCache<LegacyFlightCycle>(512, ttl, clockValue), 0, 0);
}

/** Selects legacy flight cycles. Empty fields match all. */
export class LegacyFlightCycleQuery {
  utmSource: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minWeight: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyFlightCycle): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyFlightCycle[]): LegacyFlightCycle[] {
    const matched = collections.filter(items, (candidate: LegacyFlightCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyFlightCycles(store: LegacyFlightCycleStore, query: LegacyFlightCycleQuery): LegacyFlightCycle[] {
  return query.apply(store.list());
}
