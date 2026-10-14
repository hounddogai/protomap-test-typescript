import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalPostAdjustment } from "./regional-post-adjustment.js";

/** Keeps regional post adjustments by code. */
export interface RegionalPostAdjustmentStore {
  find(code: string): RegionalPostAdjustment | undefined;
  save(item: RegionalPostAdjustment): void;
  remove(code: string): boolean;
  list(): RegionalPostAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalPostAdjustmentStore implements RegionalPostAdjustmentStore {
  items: Map<string, RegionalPostAdjustment>;
  order: string[];

  constructor(items: Map<string, RegionalPostAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalPostAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalPostAdjustment): void {
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

  list(): RegionalPostAdjustment[] {
    const out: RegionalPostAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalPostAdjustmentStore(): RegionalPostAdjustmentStore {
  return new MemoryRegionalPostAdjustmentStore(new Map<string, RegionalPostAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalPostAdjustmentStore implements RegionalPostAdjustmentStore {
  inner: RegionalPostAdjustmentStore;
  cache: cache.TtlCache<RegionalPostAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalPostAdjustmentStore,
    cacheValue: cache.TtlCache<RegionalPostAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalPostAdjustment | undefined {
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

  save(item: RegionalPostAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalPostAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedRegionalPostAdjustmentStore(inner: RegionalPostAdjustmentStore, ttl: number, clockValue: clock.Clock): RegionalPostAdjustmentStore {
  return new CachedRegionalPostAdjustmentStore(
    inner,
    cache.newTtlCache<RegionalPostAdjustment>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional post adjustments. Empty fields match all. */
export class RegionalPostAdjustmentQuery {
  label: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minVersion: number, statuses: string[], limit: number) {
    this.label = label;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalPostAdjustment): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalPostAdjustment[]): RegionalPostAdjustment[] {
    const matched = collections.filter(items, (candidate: RegionalPostAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalPostAdjustments(store: RegionalPostAdjustmentStore, query: RegionalPostAdjustmentQuery): RegionalPostAdjustment[] {
  return query.apply(store.list());
}
