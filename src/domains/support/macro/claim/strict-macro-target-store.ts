import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictMacroTarget } from "./strict-macro-target.js";

/** Keeps strict macro targets by code. */
export interface StrictMacroTargetStore {
  find(code: string): StrictMacroTarget | undefined;
  save(item: StrictMacroTarget): void;
  remove(code: string): boolean;
  list(): StrictMacroTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictMacroTargetStore implements StrictMacroTargetStore {
  items: Map<string, StrictMacroTarget>;
  order: string[];

  constructor(items: Map<string, StrictMacroTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictMacroTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictMacroTarget): void {
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

  list(): StrictMacroTarget[] {
    const out: StrictMacroTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictMacroTargetStore(): StrictMacroTargetStore {
  return new MemoryStrictMacroTargetStore(new Map<string, StrictMacroTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictMacroTargetStore implements StrictMacroTargetStore {
  inner: StrictMacroTargetStore;
  cache: cache.TtlCache<StrictMacroTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictMacroTargetStore,
    cacheValue: cache.TtlCache<StrictMacroTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictMacroTarget | undefined {
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

  save(item: StrictMacroTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictMacroTarget[] {
    return this.inner.list();
  }
}

export function newCachedStrictMacroTargetStore(inner: StrictMacroTargetStore, ttl: number, clockValue: clock.Clock): StrictMacroTargetStore {
  return new CachedStrictMacroTargetStore(inner, cache.newTtlCache<StrictMacroTarget>(64, ttl, clockValue), 0, 0);
}

/** Selects strict macro targets. Empty fields match all. */
export class StrictMacroTargetQuery {
  name: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBid: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictMacroTarget): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictMacroTarget[]): StrictMacroTarget[] {
    const matched = collections.filter(items, (candidate: StrictMacroTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictMacroTargets(store: StrictMacroTargetStore, query: StrictMacroTargetQuery): StrictMacroTarget[] {
  return query.apply(store.list());
}
