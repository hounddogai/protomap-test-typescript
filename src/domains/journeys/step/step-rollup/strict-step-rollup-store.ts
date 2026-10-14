import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictStepRollup } from "./strict-step-rollup.js";

/** Keeps strict step rollups by code. */
export interface StrictStepRollupStore {
  find(code: string): StrictStepRollup | undefined;
  save(item: StrictStepRollup): void;
  remove(code: string): boolean;
  list(): StrictStepRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictStepRollupStore implements StrictStepRollupStore {
  items: Map<string, StrictStepRollup>;
  order: string[];

  constructor(items: Map<string, StrictStepRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictStepRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictStepRollup): void {
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

  list(): StrictStepRollup[] {
    const out: StrictStepRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictStepRollupStore(): StrictStepRollupStore {
  return new MemoryStrictStepRollupStore(new Map<string, StrictStepRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictStepRollupStore implements StrictStepRollupStore {
  inner: StrictStepRollupStore;
  cache: cache.TtlCache<StrictStepRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictStepRollupStore,
    cacheValue: cache.TtlCache<StrictStepRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictStepRollup | undefined {
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

  save(item: StrictStepRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictStepRollup[] {
    return this.inner.list();
  }
}

export function newCachedStrictStepRollupStore(inner: StrictStepRollupStore, ttl: number, clockValue: clock.Clock): StrictStepRollupStore {
  return new CachedStrictStepRollupStore(inner, cache.newTtlCache<StrictStepRollup>(64, ttl, clockValue), 0, 0);
}

/** Selects strict step rollups. Empty fields match all. */
export class StrictStepRollupQuery {
  title: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minVersion: number, statuses: string[], limit: number) {
    this.title = title;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictStepRollup): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictStepRollup[]): StrictStepRollup[] {
    const matched = collections.filter(items, (candidate: StrictStepRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictStepRollups(store: StrictStepRollupStore, query: StrictStepRollupQuery): StrictStepRollup[] {
  return query.apply(store.list());
}
