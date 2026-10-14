import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedLevelAdjustment } from "./capped-level-adjustment.js";

/** Keeps capped level adjustments by code. */
export interface CappedLevelAdjustmentStore {
  find(code: string): CappedLevelAdjustment | undefined;
  save(item: CappedLevelAdjustment): void;
  remove(code: string): boolean;
  list(): CappedLevelAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedLevelAdjustmentStore implements CappedLevelAdjustmentStore {
  items: Map<string, CappedLevelAdjustment>;
  order: string[];

  constructor(items: Map<string, CappedLevelAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedLevelAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedLevelAdjustment): void {
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

  list(): CappedLevelAdjustment[] {
    const out: CappedLevelAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedLevelAdjustmentStore(): CappedLevelAdjustmentStore {
  return new MemoryCappedLevelAdjustmentStore(new Map<string, CappedLevelAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedLevelAdjustmentStore implements CappedLevelAdjustmentStore {
  inner: CappedLevelAdjustmentStore;
  cache: cache.TtlCache<CappedLevelAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedLevelAdjustmentStore,
    cacheValue: cache.TtlCache<CappedLevelAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedLevelAdjustment | undefined {
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

  save(item: CappedLevelAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedLevelAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedCappedLevelAdjustmentStore(inner: CappedLevelAdjustmentStore, ttl: number, clockValue: clock.Clock): CappedLevelAdjustmentStore {
  return new CachedCappedLevelAdjustmentStore(
    inner,
    cache.newTtlCache<CappedLevelAdjustment>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped level adjustments. Empty fields match all. */
export class CappedLevelAdjustmentQuery {
  name: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRevision: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedLevelAdjustment): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedLevelAdjustment[]): CappedLevelAdjustment[] {
    const matched = collections.filter(items, (candidate: CappedLevelAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedLevelAdjustments(store: CappedLevelAdjustmentStore, query: CappedLevelAdjustmentQuery): CappedLevelAdjustment[] {
  return query.apply(store.list());
}
