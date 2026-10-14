import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualTierWindow } from "./manual-tier-window.js";

/** Keeps manual tier windows by code. */
export interface ManualTierWindowStore {
  find(code: string): ManualTierWindow | undefined;
  save(item: ManualTierWindow): void;
  remove(code: string): boolean;
  list(): ManualTierWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualTierWindowStore implements ManualTierWindowStore {
  items: Map<string, ManualTierWindow>;
  order: string[];

  constructor(items: Map<string, ManualTierWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualTierWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualTierWindow): void {
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

  list(): ManualTierWindow[] {
    const out: ManualTierWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualTierWindowStore(): ManualTierWindowStore {
  return new MemoryManualTierWindowStore(new Map<string, ManualTierWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualTierWindowStore implements ManualTierWindowStore {
  inner: ManualTierWindowStore;
  cache: cache.TtlCache<ManualTierWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualTierWindowStore,
    cacheValue: cache.TtlCache<ManualTierWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualTierWindow | undefined {
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

  save(item: ManualTierWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualTierWindow[] {
    return this.inner.list();
  }
}

export function newCachedManualTierWindowStore(inner: ManualTierWindowStore, ttl: number, clockValue: clock.Clock): ManualTierWindowStore {
  return new CachedManualTierWindowStore(inner, cache.newTtlCache<ManualTierWindow>(256, ttl, clockValue), 0, 0);
}

/** Selects manual tier windows. Empty fields match all. */
export class ManualTierWindowQuery {
  source: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minImpressions: number, statuses: string[], limit: number) {
    this.source = source;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualTierWindow): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualTierWindow[]): ManualTierWindow[] {
    const matched = collections.filter(items, (candidate: ManualTierWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualTierWindows(store: ManualTierWindowStore, query: ManualTierWindowQuery): ManualTierWindow[] {
  return query.apply(store.list());
}
