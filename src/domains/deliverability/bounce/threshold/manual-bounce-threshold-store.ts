import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualBounceThreshold } from "./manual-bounce-threshold.js";

/** Keeps manual bounce thresholds by code. */
export interface ManualBounceThresholdStore {
  find(code: string): ManualBounceThreshold | undefined;
  save(item: ManualBounceThreshold): void;
  remove(code: string): boolean;
  list(): ManualBounceThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualBounceThresholdStore implements ManualBounceThresholdStore {
  items: Map<string, ManualBounceThreshold>;
  order: string[];

  constructor(items: Map<string, ManualBounceThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualBounceThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualBounceThreshold): void {
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

  list(): ManualBounceThreshold[] {
    const out: ManualBounceThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualBounceThresholdStore(): ManualBounceThresholdStore {
  return new MemoryManualBounceThresholdStore(new Map<string, ManualBounceThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualBounceThresholdStore implements ManualBounceThresholdStore {
  inner: ManualBounceThresholdStore;
  cache: cache.TtlCache<ManualBounceThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualBounceThresholdStore,
    cacheValue: cache.TtlCache<ManualBounceThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualBounceThreshold | undefined {
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

  save(item: ManualBounceThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualBounceThreshold[] {
    return this.inner.list();
  }
}

export function newCachedManualBounceThresholdStore(inner: ManualBounceThresholdStore, ttl: number, clockValue: clock.Clock): ManualBounceThresholdStore {
  return new CachedManualBounceThresholdStore(
    inner,
    cache.newTtlCache<ManualBounceThreshold>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual bounce thresholds. Empty fields match all. */
export class ManualBounceThresholdQuery {
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

  matches(item: ManualBounceThreshold): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualBounceThreshold[]): ManualBounceThreshold[] {
    const matched = collections.filter(items, (candidate: ManualBounceThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualBounceThresholds(store: ManualBounceThresholdStore, query: ManualBounceThresholdQuery): ManualBounceThreshold[] {
  return query.apply(store.list());
}
