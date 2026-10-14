import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultPathAdjustment } from "./default-path-adjustment.js";

/** Keeps default path adjustments by code. */
export interface DefaultPathAdjustmentStore {
  find(code: string): DefaultPathAdjustment | undefined;
  save(item: DefaultPathAdjustment): void;
  remove(code: string): boolean;
  list(): DefaultPathAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultPathAdjustmentStore implements DefaultPathAdjustmentStore {
  items: Map<string, DefaultPathAdjustment>;
  order: string[];

  constructor(items: Map<string, DefaultPathAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultPathAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultPathAdjustment): void {
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

  list(): DefaultPathAdjustment[] {
    const out: DefaultPathAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultPathAdjustmentStore(): DefaultPathAdjustmentStore {
  return new MemoryDefaultPathAdjustmentStore(new Map<string, DefaultPathAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultPathAdjustmentStore implements DefaultPathAdjustmentStore {
  inner: DefaultPathAdjustmentStore;
  cache: cache.TtlCache<DefaultPathAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultPathAdjustmentStore,
    cacheValue: cache.TtlCache<DefaultPathAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultPathAdjustment | undefined {
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

  save(item: DefaultPathAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultPathAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedDefaultPathAdjustmentStore(inner: DefaultPathAdjustmentStore, ttl: number, clockValue: clock.Clock): DefaultPathAdjustmentStore {
  return new CachedDefaultPathAdjustmentStore(
    inner,
    cache.newTtlCache<DefaultPathAdjustment>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default path adjustments. Empty fields match all. */
export class DefaultPathAdjustmentQuery {
  title: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minGraceDays: number, statuses: string[], limit: number) {
    this.title = title;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultPathAdjustment): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultPathAdjustment[]): DefaultPathAdjustment[] {
    const matched = collections.filter(items, (candidate: DefaultPathAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultPathAdjustments(store: DefaultPathAdjustmentStore, query: DefaultPathAdjustmentQuery): DefaultPathAdjustment[] {
  return query.apply(store.list());
}
