import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { OptOutOverride } from "./opt-out-override.js";

/** Keeps opt out overrides by code. */
export interface OptOutOverrideStore {
  find(code: string): OptOutOverride | undefined;
  save(item: OptOutOverride): void;
  remove(code: string): boolean;
  list(): OptOutOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryOptOutOverrideStore implements OptOutOverrideStore {
  items: Map<string, OptOutOverride>;
  order: string[];

  constructor(items: Map<string, OptOutOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): OptOutOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: OptOutOverride): void {
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

  list(): OptOutOverride[] {
    const out: OptOutOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryOptOutOverrideStore(): OptOutOverrideStore {
  return new MemoryOptOutOverrideStore(new Map<string, OptOutOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedOptOutOverrideStore implements OptOutOverrideStore {
  inner: OptOutOverrideStore;
  cache: cache.TtlCache<OptOutOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: OptOutOverrideStore,
    cacheValue: cache.TtlCache<OptOutOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): OptOutOverride | undefined {
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

  save(item: OptOutOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): OptOutOverride[] {
    return this.inner.list();
  }
}

export function newCachedOptOutOverrideStore(inner: OptOutOverrideStore, ttl: number, clockValue: clock.Clock): OptOutOverrideStore {
  return new CachedOptOutOverrideStore(inner, cache.newTtlCache<OptOutOverride>(512, ttl, clockValue), 0, 0);
}

/** Selects opt out overrides. Empty fields match all. */
export class OptOutOverrideQuery {
  locale: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minAmount: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: OptOutOverride): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: OptOutOverride[]): OptOutOverride[] {
    const matched = collections.filter(items, (candidate: OptOutOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findOptOutOverrides(store: OptOutOverrideStore, query: OptOutOverrideQuery): OptOutOverride[] {
  return query.apply(store.list());
}
