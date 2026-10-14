import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalStepCycle } from "./seasonal-step-cycle.js";

/** Keeps seasonal step cycles by code. */
export interface SeasonalStepCycleStore {
  find(code: string): SeasonalStepCycle | undefined;
  save(item: SeasonalStepCycle): void;
  remove(code: string): boolean;
  list(): SeasonalStepCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalStepCycleStore implements SeasonalStepCycleStore {
  items: Map<string, SeasonalStepCycle>;
  order: string[];

  constructor(items: Map<string, SeasonalStepCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalStepCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalStepCycle): void {
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

  list(): SeasonalStepCycle[] {
    const out: SeasonalStepCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalStepCycleStore(): SeasonalStepCycleStore {
  return new MemorySeasonalStepCycleStore(new Map<string, SeasonalStepCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalStepCycleStore implements SeasonalStepCycleStore {
  inner: SeasonalStepCycleStore;
  cache: cache.TtlCache<SeasonalStepCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalStepCycleStore,
    cacheValue: cache.TtlCache<SeasonalStepCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalStepCycle | undefined {
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

  save(item: SeasonalStepCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalStepCycle[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalStepCycleStore(inner: SeasonalStepCycleStore, ttl: number, clockValue: clock.Clock): SeasonalStepCycleStore {
  return new CachedSeasonalStepCycleStore(inner, cache.newTtlCache<SeasonalStepCycle>(64, ttl, clockValue), 0, 0);
}

/** Selects seasonal step cycles. Empty fields match all. */
export class SeasonalStepCycleQuery {
  label: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minWindowDays: number, statuses: string[], limit: number) {
    this.label = label;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalStepCycle): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalStepCycle[]): SeasonalStepCycle[] {
    const matched = collections.filter(items, (candidate: SeasonalStepCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalStepCycles(store: SeasonalStepCycleStore, query: SeasonalStepCycleQuery): SeasonalStepCycle[] {
  return query.apply(store.list());
}
