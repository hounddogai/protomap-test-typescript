import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PreferenceGroup } from "./preference-group.js";

/** Keeps preference groups by code. */
export interface PreferenceGroupStore {
  find(code: string): PreferenceGroup | undefined;
  save(item: PreferenceGroup): void;
  remove(code: string): boolean;
  list(): PreferenceGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPreferenceGroupStore implements PreferenceGroupStore {
  items: Map<string, PreferenceGroup>;
  order: string[];

  constructor(items: Map<string, PreferenceGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PreferenceGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PreferenceGroup): void {
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

  list(): PreferenceGroup[] {
    const out: PreferenceGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPreferenceGroupStore(): PreferenceGroupStore {
  return new MemoryPreferenceGroupStore(new Map<string, PreferenceGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPreferenceGroupStore implements PreferenceGroupStore {
  inner: PreferenceGroupStore;
  cache: cache.TtlCache<PreferenceGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: PreferenceGroupStore,
    cacheValue: cache.TtlCache<PreferenceGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PreferenceGroup | undefined {
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

  save(item: PreferenceGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PreferenceGroup[] {
    return this.inner.list();
  }
}

export function newCachedPreferenceGroupStore(inner: PreferenceGroupStore, ttl: number, clockValue: clock.Clock): PreferenceGroupStore {
  return new CachedPreferenceGroupStore(inner, cache.newTtlCache<PreferenceGroup>(128, ttl, clockValue), 0, 0);
}

/** Selects preference groups. Empty fields match all. */
export class PreferenceGroupQuery {
  title: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minDiscount: number, statuses: string[], limit: number) {
    this.title = title;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PreferenceGroup): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PreferenceGroup[]): PreferenceGroup[] {
    const matched = collections.filter(items, (candidate: PreferenceGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPreferenceGroups(store: PreferenceGroupStore, query: PreferenceGroupQuery): PreferenceGroup[] {
  return query.apply(store.list());
}
