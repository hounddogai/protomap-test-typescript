import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictExitRuleCycle } from "./strict-exit-rule-cycle.js";

/** Keeps strict exit rule cycles by code. */
export interface StrictExitRuleCycleStore {
  find(code: string): StrictExitRuleCycle | undefined;
  save(item: StrictExitRuleCycle): void;
  remove(code: string): boolean;
  list(): StrictExitRuleCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictExitRuleCycleStore implements StrictExitRuleCycleStore {
  items: Map<string, StrictExitRuleCycle>;
  order: string[];

  constructor(items: Map<string, StrictExitRuleCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictExitRuleCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictExitRuleCycle): void {
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

  list(): StrictExitRuleCycle[] {
    const out: StrictExitRuleCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictExitRuleCycleStore(): StrictExitRuleCycleStore {
  return new MemoryStrictExitRuleCycleStore(new Map<string, StrictExitRuleCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictExitRuleCycleStore implements StrictExitRuleCycleStore {
  inner: StrictExitRuleCycleStore;
  cache: cache.TtlCache<StrictExitRuleCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictExitRuleCycleStore,
    cacheValue: cache.TtlCache<StrictExitRuleCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictExitRuleCycle | undefined {
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

  save(item: StrictExitRuleCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictExitRuleCycle[] {
    return this.inner.list();
  }
}

export function newCachedStrictExitRuleCycleStore(inner: StrictExitRuleCycleStore, ttl: number, clockValue: clock.Clock): StrictExitRuleCycleStore {
  return new CachedStrictExitRuleCycleStore(inner, cache.newTtlCache<StrictExitRuleCycle>(512, ttl, clockValue), 0, 0);
}

/** Selects strict exit rule cycles. Empty fields match all. */
export class StrictExitRuleCycleQuery {
  name: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minLimit: number, statuses: string[], limit: number) {
    this.name = name;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictExitRuleCycle): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictExitRuleCycle[]): StrictExitRuleCycle[] {
    const matched = collections.filter(items, (candidate: StrictExitRuleCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictExitRuleCycles(store: StrictExitRuleCycleStore, query: StrictExitRuleCycleQuery): StrictExitRuleCycle[] {
  return query.apply(store.list());
}
