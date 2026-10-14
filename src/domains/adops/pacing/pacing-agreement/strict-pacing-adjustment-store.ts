import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictPacingAdjustment } from "./strict-pacing-adjustment.js";

/** Keeps strict pacing adjustments by code. */
export interface StrictPacingAdjustmentStore {
  find(code: string): StrictPacingAdjustment | undefined;
  save(item: StrictPacingAdjustment): void;
  remove(code: string): boolean;
  list(): StrictPacingAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictPacingAdjustmentStore implements StrictPacingAdjustmentStore {
  items: Map<string, StrictPacingAdjustment>;
  order: string[];

  constructor(items: Map<string, StrictPacingAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictPacingAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictPacingAdjustment): void {
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

  list(): StrictPacingAdjustment[] {
    const out: StrictPacingAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictPacingAdjustmentStore(): StrictPacingAdjustmentStore {
  return new MemoryStrictPacingAdjustmentStore(new Map<string, StrictPacingAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictPacingAdjustmentStore implements StrictPacingAdjustmentStore {
  inner: StrictPacingAdjustmentStore;
  cache: cache.TtlCache<StrictPacingAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictPacingAdjustmentStore,
    cacheValue: cache.TtlCache<StrictPacingAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictPacingAdjustment | undefined {
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

  save(item: StrictPacingAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictPacingAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedStrictPacingAdjustmentStore(inner: StrictPacingAdjustmentStore, ttl: number, clockValue: clock.Clock): StrictPacingAdjustmentStore {
  return new CachedStrictPacingAdjustmentStore(
    inner,
    cache.newTtlCache<StrictPacingAdjustment>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict pacing adjustments. Empty fields match all. */
export class StrictPacingAdjustmentQuery {
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

  matches(item: StrictPacingAdjustment): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictPacingAdjustment[]): StrictPacingAdjustment[] {
    const matched = collections.filter(items, (candidate: StrictPacingAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictPacingAdjustments(store: StrictPacingAdjustmentStore, query: StrictPacingAdjustmentQuery): StrictPacingAdjustment[] {
  return query.apply(store.list());
}
