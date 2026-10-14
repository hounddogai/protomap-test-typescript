import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ComplaintThreshold } from "./complaint-threshold.js";

/** Keeps complaint thresholds by code. */
export interface ComplaintThresholdStore {
  find(code: string): ComplaintThreshold | undefined;
  save(item: ComplaintThreshold): void;
  remove(code: string): boolean;
  list(): ComplaintThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryComplaintThresholdStore implements ComplaintThresholdStore {
  items: Map<string, ComplaintThreshold>;
  order: string[];

  constructor(items: Map<string, ComplaintThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ComplaintThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ComplaintThreshold): void {
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

  list(): ComplaintThreshold[] {
    const out: ComplaintThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryComplaintThresholdStore(): ComplaintThresholdStore {
  return new MemoryComplaintThresholdStore(new Map<string, ComplaintThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedComplaintThresholdStore implements ComplaintThresholdStore {
  inner: ComplaintThresholdStore;
  cache: cache.TtlCache<ComplaintThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: ComplaintThresholdStore,
    cacheValue: cache.TtlCache<ComplaintThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ComplaintThreshold | undefined {
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

  save(item: ComplaintThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ComplaintThreshold[] {
    return this.inner.list();
  }
}

export function newCachedComplaintThresholdStore(inner: ComplaintThresholdStore, ttl: number, clockValue: clock.Clock): ComplaintThresholdStore {
  return new CachedComplaintThresholdStore(inner, cache.newTtlCache<ComplaintThreshold>(64, ttl, clockValue), 0, 0);
}

/** Selects complaint thresholds. Empty fields match all. */
export class ComplaintThresholdQuery {
  label: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMargin: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ComplaintThreshold): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ComplaintThreshold[]): ComplaintThreshold[] {
    const matched = collections.filter(items, (candidate: ComplaintThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findComplaintThresholds(store: ComplaintThresholdStore, query: ComplaintThresholdQuery): ComplaintThreshold[] {
  return query.apply(store.list());
}
