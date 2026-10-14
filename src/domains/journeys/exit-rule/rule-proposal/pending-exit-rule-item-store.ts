import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingExitRuleItem } from "./pending-exit-rule-item.js";

/** Keeps pending exit rule items by code. */
export interface PendingExitRuleItemStore {
  find(code: string): PendingExitRuleItem | undefined;
  save(item: PendingExitRuleItem): void;
  remove(code: string): boolean;
  list(): PendingExitRuleItem[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingExitRuleItemStore implements PendingExitRuleItemStore {
  items: Map<string, PendingExitRuleItem>;
  order: string[];

  constructor(items: Map<string, PendingExitRuleItem>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingExitRuleItem | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingExitRuleItem): void {
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

  list(): PendingExitRuleItem[] {
    const out: PendingExitRuleItem[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingExitRuleItemStore(): PendingExitRuleItemStore {
  return new MemoryPendingExitRuleItemStore(new Map<string, PendingExitRuleItem>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingExitRuleItemStore implements PendingExitRuleItemStore {
  inner: PendingExitRuleItemStore;
  cache: cache.TtlCache<PendingExitRuleItem>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingExitRuleItemStore,
    cacheValue: cache.TtlCache<PendingExitRuleItem>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingExitRuleItem | undefined {
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

  save(item: PendingExitRuleItem): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingExitRuleItem[] {
    return this.inner.list();
  }
}

export function newCachedPendingExitRuleItemStore(inner: PendingExitRuleItemStore, ttl: number, clockValue: clock.Clock): PendingExitRuleItemStore {
  return new CachedPendingExitRuleItemStore(inner, cache.newTtlCache<PendingExitRuleItem>(1024, ttl, clockValue), 0, 0);
}

/** Selects pending exit rule items. Empty fields match all. */
export class PendingExitRuleItemQuery {
  country: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minBatchSize: number, statuses: string[], limit: number) {
    this.country = country;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingExitRuleItem): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingExitRuleItem[]): PendingExitRuleItem[] {
    const matched = collections.filter(items, (candidate: PendingExitRuleItem): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingExitRuleItems(store: PendingExitRuleItemStore, query: PendingExitRuleItemQuery): PendingExitRuleItem[] {
  return query.apply(store.list());
}
