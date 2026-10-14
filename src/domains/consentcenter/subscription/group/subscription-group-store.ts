import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SubscriptionGroup } from "./subscription-group.js";

/** Keeps subscription groups by code. */
export interface SubscriptionGroupStore {
  find(code: string): SubscriptionGroup | undefined;
  save(item: SubscriptionGroup): void;
  remove(code: string): boolean;
  list(): SubscriptionGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySubscriptionGroupStore implements SubscriptionGroupStore {
  items: Map<string, SubscriptionGroup>;
  order: string[];

  constructor(items: Map<string, SubscriptionGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SubscriptionGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SubscriptionGroup): void {
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

  list(): SubscriptionGroup[] {
    const out: SubscriptionGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySubscriptionGroupStore(): SubscriptionGroupStore {
  return new MemorySubscriptionGroupStore(new Map<string, SubscriptionGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSubscriptionGroupStore implements SubscriptionGroupStore {
  inner: SubscriptionGroupStore;
  cache: cache.TtlCache<SubscriptionGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: SubscriptionGroupStore,
    cacheValue: cache.TtlCache<SubscriptionGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SubscriptionGroup | undefined {
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

  save(item: SubscriptionGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SubscriptionGroup[] {
    return this.inner.list();
  }
}

export function newCachedSubscriptionGroupStore(inner: SubscriptionGroupStore, ttl: number, clockValue: clock.Clock): SubscriptionGroupStore {
  return new CachedSubscriptionGroupStore(inner, cache.newTtlCache<SubscriptionGroup>(512, ttl, clockValue), 0, 0);
}

/** Selects subscription groups. Empty fields match all. */
export class SubscriptionGroupQuery {
  source: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minGraceDays: number, statuses: string[], limit: number) {
    this.source = source;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SubscriptionGroup): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SubscriptionGroup[]): SubscriptionGroup[] {
    const matched = collections.filter(items, (candidate: SubscriptionGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSubscriptionGroups(store: SubscriptionGroupStore, query: SubscriptionGroupQuery): SubscriptionGroup[] {
  return query.apply(store.list());
}
