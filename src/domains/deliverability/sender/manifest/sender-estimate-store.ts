import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SenderEstimate } from "./sender-estimate.js";

/** Keeps sender estimates by code. */
export interface SenderEstimateStore {
  find(code: string): SenderEstimate | undefined;
  save(item: SenderEstimate): void;
  remove(code: string): boolean;
  list(): SenderEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySenderEstimateStore implements SenderEstimateStore {
  items: Map<string, SenderEstimate>;
  order: string[];

  constructor(items: Map<string, SenderEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SenderEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SenderEstimate): void {
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

  list(): SenderEstimate[] {
    const out: SenderEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySenderEstimateStore(): SenderEstimateStore {
  return new MemorySenderEstimateStore(new Map<string, SenderEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSenderEstimateStore implements SenderEstimateStore {
  inner: SenderEstimateStore;
  cache: cache.TtlCache<SenderEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: SenderEstimateStore,
    cacheValue: cache.TtlCache<SenderEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SenderEstimate | undefined {
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

  save(item: SenderEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SenderEstimate[] {
    return this.inner.list();
  }
}

export function newCachedSenderEstimateStore(inner: SenderEstimateStore, ttl: number, clockValue: clock.Clock): SenderEstimateStore {
  return new CachedSenderEstimateStore(inner, cache.newTtlCache<SenderEstimate>(512, ttl, clockValue), 0, 0);
}

/** Selects sender estimates. Empty fields match all. */
export class SenderEstimateQuery {
  label: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCeiling: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SenderEstimate): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SenderEstimate[]): SenderEstimate[] {
    const matched = collections.filter(items, (candidate: SenderEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSenderEstimates(store: SenderEstimateStore, query: SenderEstimateQuery): SenderEstimate[] {
  return query.apply(store.list());
}
