import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryDeflectionBaseline } from "./primary-deflection-baseline.js";

/** Keeps primary deflection baselines by code. */
export interface PrimaryDeflectionBaselineStore {
  find(code: string): PrimaryDeflectionBaseline | undefined;
  save(item: PrimaryDeflectionBaseline): void;
  remove(code: string): boolean;
  list(): PrimaryDeflectionBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryDeflectionBaselineStore implements PrimaryDeflectionBaselineStore {
  items: Map<string, PrimaryDeflectionBaseline>;
  order: string[];

  constructor(items: Map<string, PrimaryDeflectionBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryDeflectionBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryDeflectionBaseline): void {
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

  list(): PrimaryDeflectionBaseline[] {
    const out: PrimaryDeflectionBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryDeflectionBaselineStore(): PrimaryDeflectionBaselineStore {
  return new MemoryPrimaryDeflectionBaselineStore(new Map<string, PrimaryDeflectionBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryDeflectionBaselineStore implements PrimaryDeflectionBaselineStore {
  inner: PrimaryDeflectionBaselineStore;
  cache: cache.TtlCache<PrimaryDeflectionBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryDeflectionBaselineStore,
    cacheValue: cache.TtlCache<PrimaryDeflectionBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryDeflectionBaseline | undefined {
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

  save(item: PrimaryDeflectionBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryDeflectionBaseline[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryDeflectionBaselineStore(inner: PrimaryDeflectionBaselineStore, ttl: number, clockValue: clock.Clock): PrimaryDeflectionBaselineStore {
  return new CachedPrimaryDeflectionBaselineStore(
    inner,
    cache.newTtlCache<PrimaryDeflectionBaseline>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary deflection baselines. Empty fields match all. */
export class PrimaryDeflectionBaselineQuery {
  title: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCeiling: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryDeflectionBaseline): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryDeflectionBaseline[]): PrimaryDeflectionBaseline[] {
    const matched = collections.filter(items, (candidate: PrimaryDeflectionBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryDeflectionBaselines(store: PrimaryDeflectionBaselineStore, query: PrimaryDeflectionBaselineQuery): PrimaryDeflectionBaseline[] {
  return query.apply(store.list());
}
