import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingNudgeEstimate } from "./rolling-nudge-estimate.js";

/** Keeps rolling nudge estimates by code. */
export interface RollingNudgeEstimateStore {
  find(code: string): RollingNudgeEstimate | undefined;
  save(item: RollingNudgeEstimate): void;
  remove(code: string): boolean;
  list(): RollingNudgeEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingNudgeEstimateStore implements RollingNudgeEstimateStore {
  items: Map<string, RollingNudgeEstimate>;
  order: string[];

  constructor(items: Map<string, RollingNudgeEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingNudgeEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingNudgeEstimate): void {
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

  list(): RollingNudgeEstimate[] {
    const out: RollingNudgeEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingNudgeEstimateStore(): RollingNudgeEstimateStore {
  return new MemoryRollingNudgeEstimateStore(new Map<string, RollingNudgeEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingNudgeEstimateStore implements RollingNudgeEstimateStore {
  inner: RollingNudgeEstimateStore;
  cache: cache.TtlCache<RollingNudgeEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingNudgeEstimateStore,
    cacheValue: cache.TtlCache<RollingNudgeEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingNudgeEstimate | undefined {
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

  save(item: RollingNudgeEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingNudgeEstimate[] {
    return this.inner.list();
  }
}

export function newCachedRollingNudgeEstimateStore(inner: RollingNudgeEstimateStore, ttl: number, clockValue: clock.Clock): RollingNudgeEstimateStore {
  return new CachedRollingNudgeEstimateStore(inner, cache.newTtlCache<RollingNudgeEstimate>(64, ttl, clockValue), 0, 0);
}

/** Selects rolling nudge estimates. Empty fields match all. */
export class RollingNudgeEstimateQuery {
  label: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRate: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingNudgeEstimate): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingNudgeEstimate[]): RollingNudgeEstimate[] {
    const matched = collections.filter(items, (candidate: RollingNudgeEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingNudgeEstimates(store: RollingNudgeEstimateStore, query: RollingNudgeEstimateQuery): RollingNudgeEstimate[] {
  return query.apply(store.list());
}
