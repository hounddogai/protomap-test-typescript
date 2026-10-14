import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SlaThreshold } from "./sla-threshold.js";

/** Keeps sla thresholds by code. */
export interface SlaThresholdStore {
  find(code: string): SlaThreshold | undefined;
  save(item: SlaThreshold): void;
  remove(code: string): boolean;
  list(): SlaThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySlaThresholdStore implements SlaThresholdStore {
  items: Map<string, SlaThreshold>;
  order: string[];

  constructor(items: Map<string, SlaThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SlaThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SlaThreshold): void {
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

  list(): SlaThreshold[] {
    const out: SlaThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySlaThresholdStore(): SlaThresholdStore {
  return new MemorySlaThresholdStore(new Map<string, SlaThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSlaThresholdStore implements SlaThresholdStore {
  inner: SlaThresholdStore;
  cache: cache.TtlCache<SlaThreshold>;
  hits: number;
  misses: number;

  constructor(inner: SlaThresholdStore, cacheValue: cache.TtlCache<SlaThreshold>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SlaThreshold | undefined {
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

  save(item: SlaThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SlaThreshold[] {
    return this.inner.list();
  }
}

export function newCachedSlaThresholdStore(inner: SlaThresholdStore, ttl: number, clockValue: clock.Clock): SlaThresholdStore {
  return new CachedSlaThresholdStore(inner, cache.newTtlCache<SlaThreshold>(256, ttl, clockValue), 0, 0);
}

/** Selects sla thresholds. Empty fields match all. */
export class SlaThresholdQuery {
  segment: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minBudget: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SlaThreshold): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SlaThreshold[]): SlaThreshold[] {
    const matched = collections.filter(items, (candidate: SlaThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSlaThresholds(store: SlaThresholdStore, query: SlaThresholdQuery): SlaThreshold[] {
  return query.apply(store.list());
}
