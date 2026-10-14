import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryEscalationEstimate } from "./primary-escalation-estimate.js";

/** Keeps primary escalation estimates by code. */
export interface PrimaryEscalationEstimateStore {
  find(code: string): PrimaryEscalationEstimate | undefined;
  save(item: PrimaryEscalationEstimate): void;
  remove(code: string): boolean;
  list(): PrimaryEscalationEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryEscalationEstimateStore implements PrimaryEscalationEstimateStore {
  items: Map<string, PrimaryEscalationEstimate>;
  order: string[];

  constructor(items: Map<string, PrimaryEscalationEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryEscalationEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryEscalationEstimate): void {
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

  list(): PrimaryEscalationEstimate[] {
    const out: PrimaryEscalationEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryEscalationEstimateStore(): PrimaryEscalationEstimateStore {
  return new MemoryPrimaryEscalationEstimateStore(new Map<string, PrimaryEscalationEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryEscalationEstimateStore implements PrimaryEscalationEstimateStore {
  inner: PrimaryEscalationEstimateStore;
  cache: cache.TtlCache<PrimaryEscalationEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryEscalationEstimateStore,
    cacheValue: cache.TtlCache<PrimaryEscalationEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryEscalationEstimate | undefined {
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

  save(item: PrimaryEscalationEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryEscalationEstimate[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryEscalationEstimateStore(inner: PrimaryEscalationEstimateStore, ttl: number, clockValue: clock.Clock): PrimaryEscalationEstimateStore {
  return new CachedPrimaryEscalationEstimateStore(
    inner,
    cache.newTtlCache<PrimaryEscalationEstimate>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary escalation estimates. Empty fields match all. */
export class PrimaryEscalationEstimateQuery {
  title: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRatio: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryEscalationEstimate): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryEscalationEstimate[]): PrimaryEscalationEstimate[] {
    const matched = collections.filter(items, (candidate: PrimaryEscalationEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryEscalationEstimates(store: PrimaryEscalationEstimateStore, query: PrimaryEscalationEstimateQuery): PrimaryEscalationEstimate[] {
  return query.apply(store.list());
}
