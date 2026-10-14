import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FraudCheckGroup } from "./fraud-check-group.js";

/** Keeps fraud check groups by code. */
export interface FraudCheckGroupStore {
  find(code: string): FraudCheckGroup | undefined;
  save(item: FraudCheckGroup): void;
  remove(code: string): boolean;
  list(): FraudCheckGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFraudCheckGroupStore implements FraudCheckGroupStore {
  items: Map<string, FraudCheckGroup>;
  order: string[];

  constructor(items: Map<string, FraudCheckGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FraudCheckGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FraudCheckGroup): void {
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

  list(): FraudCheckGroup[] {
    const out: FraudCheckGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFraudCheckGroupStore(): FraudCheckGroupStore {
  return new MemoryFraudCheckGroupStore(new Map<string, FraudCheckGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFraudCheckGroupStore implements FraudCheckGroupStore {
  inner: FraudCheckGroupStore;
  cache: cache.TtlCache<FraudCheckGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: FraudCheckGroupStore,
    cacheValue: cache.TtlCache<FraudCheckGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FraudCheckGroup | undefined {
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

  save(item: FraudCheckGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FraudCheckGroup[] {
    return this.inner.list();
  }
}

export function newCachedFraudCheckGroupStore(inner: FraudCheckGroupStore, ttl: number, clockValue: clock.Clock): FraudCheckGroupStore {
  return new CachedFraudCheckGroupStore(inner, cache.newTtlCache<FraudCheckGroup>(256, ttl, clockValue), 0, 0);
}

/** Selects fraud check groups. Empty fields match all. */
export class FraudCheckGroupQuery {
  locale: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minThreshold: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FraudCheckGroup): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FraudCheckGroup[]): FraudCheckGroup[] {
    const matched = collections.filter(items, (candidate: FraudCheckGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFraudCheckGroups(store: FraudCheckGroupStore, query: FraudCheckGroupQuery): FraudCheckGroup[] {
  return query.apply(store.list());
}
