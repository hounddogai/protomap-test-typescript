import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictProofAdjustment } from "./strict-proof-adjustment.js";

/** Keeps strict proof adjustments by code. */
export interface StrictProofAdjustmentStore {
  find(code: string): StrictProofAdjustment | undefined;
  save(item: StrictProofAdjustment): void;
  remove(code: string): boolean;
  list(): StrictProofAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictProofAdjustmentStore implements StrictProofAdjustmentStore {
  items: Map<string, StrictProofAdjustment>;
  order: string[];

  constructor(items: Map<string, StrictProofAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictProofAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictProofAdjustment): void {
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

  list(): StrictProofAdjustment[] {
    const out: StrictProofAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictProofAdjustmentStore(): StrictProofAdjustmentStore {
  return new MemoryStrictProofAdjustmentStore(new Map<string, StrictProofAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictProofAdjustmentStore implements StrictProofAdjustmentStore {
  inner: StrictProofAdjustmentStore;
  cache: cache.TtlCache<StrictProofAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictProofAdjustmentStore,
    cacheValue: cache.TtlCache<StrictProofAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictProofAdjustment | undefined {
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

  save(item: StrictProofAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictProofAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedStrictProofAdjustmentStore(inner: StrictProofAdjustmentStore, ttl: number, clockValue: clock.Clock): StrictProofAdjustmentStore {
  return new CachedStrictProofAdjustmentStore(
    inner,
    cache.newTtlCache<StrictProofAdjustment>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict proof adjustments. Empty fields match all. */
export class StrictProofAdjustmentQuery {
  title: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minWindowDays: number, statuses: string[], limit: number) {
    this.title = title;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictProofAdjustment): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictProofAdjustment[]): StrictProofAdjustment[] {
    const matched = collections.filter(items, (candidate: StrictProofAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictProofAdjustments(store: StrictProofAdjustmentStore, query: StrictProofAdjustmentQuery): StrictProofAdjustment[] {
  return query.apply(store.list());
}
