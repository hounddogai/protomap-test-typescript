import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyTierItem } from "./legacy-tier-item.js";

/** Keeps legacy tier items by code. */
export interface LegacyTierItemStore {
  find(code: string): LegacyTierItem | undefined;
  save(item: LegacyTierItem): void;
  remove(code: string): boolean;
  list(): LegacyTierItem[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyTierItemStore implements LegacyTierItemStore {
  items: Map<string, LegacyTierItem>;
  order: string[];

  constructor(items: Map<string, LegacyTierItem>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyTierItem | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyTierItem): void {
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

  list(): LegacyTierItem[] {
    const out: LegacyTierItem[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyTierItemStore(): LegacyTierItemStore {
  return new MemoryLegacyTierItemStore(new Map<string, LegacyTierItem>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyTierItemStore implements LegacyTierItemStore {
  inner: LegacyTierItemStore;
  cache: cache.TtlCache<LegacyTierItem>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyTierItemStore,
    cacheValue: cache.TtlCache<LegacyTierItem>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyTierItem | undefined {
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

  save(item: LegacyTierItem): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyTierItem[] {
    return this.inner.list();
  }
}

export function newCachedLegacyTierItemStore(inner: LegacyTierItemStore, ttl: number, clockValue: clock.Clock): LegacyTierItemStore {
  return new CachedLegacyTierItemStore(inner, cache.newTtlCache<LegacyTierItem>(512, ttl, clockValue), 0, 0);
}

/** Selects legacy tier items. Empty fields match all. */
export class LegacyTierItemQuery {
  locale: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minVersion: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyTierItem): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyTierItem[]): LegacyTierItem[] {
    const matched = collections.filter(items, (candidate: LegacyTierItem): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyTierItems(store: LegacyTierItemStore, query: LegacyTierItemQuery): LegacyTierItem[] {
  return query.apply(store.list());
}
