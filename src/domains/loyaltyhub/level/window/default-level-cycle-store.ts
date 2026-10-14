import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultLevelCycle } from "./default-level-cycle.js";

/** Keeps default level cycles by code. */
export interface DefaultLevelCycleStore {
  find(code: string): DefaultLevelCycle | undefined;
  save(item: DefaultLevelCycle): void;
  remove(code: string): boolean;
  list(): DefaultLevelCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultLevelCycleStore implements DefaultLevelCycleStore {
  items: Map<string, DefaultLevelCycle>;
  order: string[];

  constructor(items: Map<string, DefaultLevelCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultLevelCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultLevelCycle): void {
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

  list(): DefaultLevelCycle[] {
    const out: DefaultLevelCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultLevelCycleStore(): DefaultLevelCycleStore {
  return new MemoryDefaultLevelCycleStore(new Map<string, DefaultLevelCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultLevelCycleStore implements DefaultLevelCycleStore {
  inner: DefaultLevelCycleStore;
  cache: cache.TtlCache<DefaultLevelCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultLevelCycleStore,
    cacheValue: cache.TtlCache<DefaultLevelCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultLevelCycle | undefined {
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

  save(item: DefaultLevelCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultLevelCycle[] {
    return this.inner.list();
  }
}

export function newCachedDefaultLevelCycleStore(inner: DefaultLevelCycleStore, ttl: number, clockValue: clock.Clock): DefaultLevelCycleStore {
  return new CachedDefaultLevelCycleStore(inner, cache.newTtlCache<DefaultLevelCycle>(512, ttl, clockValue), 0, 0);
}

/** Selects default level cycles. Empty fields match all. */
export class DefaultLevelCycleQuery {
  name: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRatio: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultLevelCycle): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultLevelCycle[]): DefaultLevelCycle[] {
    const matched = collections.filter(items, (candidate: DefaultLevelCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultLevelCycles(store: DefaultLevelCycleStore, query: DefaultLevelCycleQuery): DefaultLevelCycle[] {
  return query.apply(store.list());
}
