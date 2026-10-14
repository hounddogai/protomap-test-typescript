import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { JourneyOverride } from "./journey-override.js";

/** Keeps journey overrides by code. */
export interface JourneyOverrideStore {
  find(code: string): JourneyOverride | undefined;
  save(item: JourneyOverride): void;
  remove(code: string): boolean;
  list(): JourneyOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryJourneyOverrideStore implements JourneyOverrideStore {
  items: Map<string, JourneyOverride>;
  order: string[];

  constructor(items: Map<string, JourneyOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): JourneyOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: JourneyOverride): void {
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

  list(): JourneyOverride[] {
    const out: JourneyOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryJourneyOverrideStore(): JourneyOverrideStore {
  return new MemoryJourneyOverrideStore(new Map<string, JourneyOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedJourneyOverrideStore implements JourneyOverrideStore {
  inner: JourneyOverrideStore;
  cache: cache.TtlCache<JourneyOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: JourneyOverrideStore,
    cacheValue: cache.TtlCache<JourneyOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): JourneyOverride | undefined {
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

  save(item: JourneyOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): JourneyOverride[] {
    return this.inner.list();
  }
}

export function newCachedJourneyOverrideStore(inner: JourneyOverrideStore, ttl: number, clockValue: clock.Clock): JourneyOverrideStore {
  return new CachedJourneyOverrideStore(inner, cache.newTtlCache<JourneyOverride>(512, ttl, clockValue), 0, 0);
}

/** Selects journey overrides. Empty fields match all. */
export class JourneyOverrideQuery {
  category: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minAmount: number, statuses: string[], limit: number) {
    this.category = category;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: JourneyOverride): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: JourneyOverride[]): JourneyOverride[] {
    const matched = collections.filter(items, (candidate: JourneyOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findJourneyOverrides(store: JourneyOverrideStore, query: JourneyOverrideQuery): JourneyOverride[] {
  return query.apply(store.list());
}
