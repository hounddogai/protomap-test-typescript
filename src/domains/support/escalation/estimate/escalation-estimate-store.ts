import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EscalationEstimate } from "./escalation-estimate.js";

/** Keeps escalation estimates by code. */
export interface EscalationEstimateStore {
  find(code: string): EscalationEstimate | undefined;
  save(item: EscalationEstimate): void;
  remove(code: string): boolean;
  list(): EscalationEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEscalationEstimateStore implements EscalationEstimateStore {
  items: Map<string, EscalationEstimate>;
  order: string[];

  constructor(items: Map<string, EscalationEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EscalationEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EscalationEstimate): void {
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

  list(): EscalationEstimate[] {
    const out: EscalationEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEscalationEstimateStore(): EscalationEstimateStore {
  return new MemoryEscalationEstimateStore(new Map<string, EscalationEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEscalationEstimateStore implements EscalationEstimateStore {
  inner: EscalationEstimateStore;
  cache: cache.TtlCache<EscalationEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: EscalationEstimateStore,
    cacheValue: cache.TtlCache<EscalationEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EscalationEstimate | undefined {
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

  save(item: EscalationEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EscalationEstimate[] {
    return this.inner.list();
  }
}

export function newCachedEscalationEstimateStore(inner: EscalationEstimateStore, ttl: number, clockValue: clock.Clock): EscalationEstimateStore {
  return new CachedEscalationEstimateStore(inner, cache.newTtlCache<EscalationEstimate>(256, ttl, clockValue), 0, 0);
}

/** Selects escalation estimates. Empty fields match all. */
export class EscalationEstimateQuery {
  category: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minPriority: number, statuses: string[], limit: number) {
    this.category = category;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EscalationEstimate): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EscalationEstimate[]): EscalationEstimate[] {
    const matched = collections.filter(items, (candidate: EscalationEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEscalationEstimates(store: EscalationEstimateStore, query: EscalationEstimateQuery): EscalationEstimate[] {
  return query.apply(store.list());
}
