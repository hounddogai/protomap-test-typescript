import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StepRollup } from "./step-rollup.js";

/** Keeps step rollups by code. */
export interface StepRollupStore {
  find(code: string): StepRollup | undefined;
  save(item: StepRollup): void;
  remove(code: string): boolean;
  list(): StepRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStepRollupStore implements StepRollupStore {
  items: Map<string, StepRollup>;
  order: string[];

  constructor(items: Map<string, StepRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StepRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StepRollup): void {
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

  list(): StepRollup[] {
    const out: StepRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStepRollupStore(): StepRollupStore {
  return new MemoryStepRollupStore(new Map<string, StepRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStepRollupStore implements StepRollupStore {
  inner: StepRollupStore;
  cache: cache.TtlCache<StepRollup>;
  hits: number;
  misses: number;

  constructor(inner: StepRollupStore, cacheValue: cache.TtlCache<StepRollup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StepRollup | undefined {
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

  save(item: StepRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StepRollup[] {
    return this.inner.list();
  }
}

export function newCachedStepRollupStore(inner: StepRollupStore, ttl: number, clockValue: clock.Clock): StepRollupStore {
  return new CachedStepRollupStore(inner, cache.newTtlCache<StepRollup>(256, ttl, clockValue), 0, 0);
}

/** Selects step rollups. Empty fields match all. */
export class StepRollupQuery {
  name: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minScore: number, statuses: string[], limit: number) {
    this.name = name;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StepRollup): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StepRollup[]): StepRollup[] {
    const matched = collections.filter(items, (candidate: StepRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStepRollups(store: StepRollupStore, query: StepRollupQuery): StepRollup[] {
  return query.apply(store.list());
}
