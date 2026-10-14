import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultInsightAdjustment } from "./default-insight-adjustment.js";

/** Keeps default insight adjustments by code. */
export interface DefaultInsightAdjustmentStore {
  find(code: string): DefaultInsightAdjustment | undefined;
  save(item: DefaultInsightAdjustment): void;
  remove(code: string): boolean;
  list(): DefaultInsightAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultInsightAdjustmentStore implements DefaultInsightAdjustmentStore {
  items: Map<string, DefaultInsightAdjustment>;
  order: string[];

  constructor(items: Map<string, DefaultInsightAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultInsightAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultInsightAdjustment): void {
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

  list(): DefaultInsightAdjustment[] {
    const out: DefaultInsightAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultInsightAdjustmentStore(): DefaultInsightAdjustmentStore {
  return new MemoryDefaultInsightAdjustmentStore(new Map<string, DefaultInsightAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultInsightAdjustmentStore implements DefaultInsightAdjustmentStore {
  inner: DefaultInsightAdjustmentStore;
  cache: cache.TtlCache<DefaultInsightAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultInsightAdjustmentStore,
    cacheValue: cache.TtlCache<DefaultInsightAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultInsightAdjustment | undefined {
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

  save(item: DefaultInsightAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultInsightAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedDefaultInsightAdjustmentStore(inner: DefaultInsightAdjustmentStore, ttl: number, clockValue: clock.Clock): DefaultInsightAdjustmentStore {
  return new CachedDefaultInsightAdjustmentStore(
    inner,
    cache.newTtlCache<DefaultInsightAdjustment>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default insight adjustments. Empty fields match all. */
export class DefaultInsightAdjustmentQuery {
  unit: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minVersion: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultInsightAdjustment): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultInsightAdjustment[]): DefaultInsightAdjustment[] {
    const matched = collections.filter(items, (candidate: DefaultInsightAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultInsightAdjustments(store: DefaultInsightAdjustmentStore, query: DefaultInsightAdjustmentQuery): DefaultInsightAdjustment[] {
  return query.apply(store.list());
}
