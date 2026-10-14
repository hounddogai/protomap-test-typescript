import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DeflectionBaseline } from "./deflection-baseline.js";

/** Keeps deflection baselines by code. */
export interface DeflectionBaselineStore {
  find(code: string): DeflectionBaseline | undefined;
  save(item: DeflectionBaseline): void;
  remove(code: string): boolean;
  list(): DeflectionBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDeflectionBaselineStore implements DeflectionBaselineStore {
  items: Map<string, DeflectionBaseline>;
  order: string[];

  constructor(items: Map<string, DeflectionBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DeflectionBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DeflectionBaseline): void {
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

  list(): DeflectionBaseline[] {
    const out: DeflectionBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDeflectionBaselineStore(): DeflectionBaselineStore {
  return new MemoryDeflectionBaselineStore(new Map<string, DeflectionBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDeflectionBaselineStore implements DeflectionBaselineStore {
  inner: DeflectionBaselineStore;
  cache: cache.TtlCache<DeflectionBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: DeflectionBaselineStore,
    cacheValue: cache.TtlCache<DeflectionBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DeflectionBaseline | undefined {
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

  save(item: DeflectionBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DeflectionBaseline[] {
    return this.inner.list();
  }
}

export function newCachedDeflectionBaselineStore(inner: DeflectionBaselineStore, ttl: number, clockValue: clock.Clock): DeflectionBaselineStore {
  return new CachedDeflectionBaselineStore(inner, cache.newTtlCache<DeflectionBaseline>(128, ttl, clockValue), 0, 0);
}

/** Selects deflection baselines. Empty fields match all. */
export class DeflectionBaselineQuery {
  name: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minSequence: number, statuses: string[], limit: number) {
    this.name = name;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DeflectionBaseline): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DeflectionBaseline[]): DeflectionBaseline[] {
    const matched = collections.filter(items, (candidate: DeflectionBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDeflectionBaselines(store: DeflectionBaselineStore, query: DeflectionBaselineQuery): DeflectionBaseline[] {
  return query.apply(store.list());
}
