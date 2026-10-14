import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PreferenceItem } from "./preference-item.js";

/** Keeps preference items by code. */
export interface PreferenceItemStore {
  find(code: string): PreferenceItem | undefined;
  save(item: PreferenceItem): void;
  remove(code: string): boolean;
  list(): PreferenceItem[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPreferenceItemStore implements PreferenceItemStore {
  items: Map<string, PreferenceItem>;
  order: string[];

  constructor(items: Map<string, PreferenceItem>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PreferenceItem | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PreferenceItem): void {
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

  list(): PreferenceItem[] {
    const out: PreferenceItem[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPreferenceItemStore(): PreferenceItemStore {
  return new MemoryPreferenceItemStore(new Map<string, PreferenceItem>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPreferenceItemStore implements PreferenceItemStore {
  inner: PreferenceItemStore;
  cache: cache.TtlCache<PreferenceItem>;
  hits: number;
  misses: number;

  constructor(
    inner: PreferenceItemStore,
    cacheValue: cache.TtlCache<PreferenceItem>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PreferenceItem | undefined {
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

  save(item: PreferenceItem): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PreferenceItem[] {
    return this.inner.list();
  }
}

export function newCachedPreferenceItemStore(inner: PreferenceItemStore, ttl: number, clockValue: clock.Clock): PreferenceItemStore {
  return new CachedPreferenceItemStore(inner, cache.newTtlCache<PreferenceItem>(64, ttl, clockValue), 0, 0);
}

/** Selects preference items. Empty fields match all. */
export class PreferenceItemQuery {
  segment: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minSequence: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PreferenceItem): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PreferenceItem[]): PreferenceItem[] {
    const matched = collections.filter(items, (candidate: PreferenceItem): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPreferenceItems(store: PreferenceItemStore, query: PreferenceItemQuery): PreferenceItem[] {
  return query.apply(store.list());
}
