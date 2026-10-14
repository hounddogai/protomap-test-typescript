import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryPreferenceGroup } from "./primary-preference-group.js";

/** Keeps primary preference groups by code. */
export interface PrimaryPreferenceGroupStore {
  find(code: string): PrimaryPreferenceGroup | undefined;
  save(item: PrimaryPreferenceGroup): void;
  remove(code: string): boolean;
  list(): PrimaryPreferenceGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryPreferenceGroupStore implements PrimaryPreferenceGroupStore {
  items: Map<string, PrimaryPreferenceGroup>;
  order: string[];

  constructor(items: Map<string, PrimaryPreferenceGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryPreferenceGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryPreferenceGroup): void {
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

  list(): PrimaryPreferenceGroup[] {
    const out: PrimaryPreferenceGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryPreferenceGroupStore(): PrimaryPreferenceGroupStore {
  return new MemoryPrimaryPreferenceGroupStore(new Map<string, PrimaryPreferenceGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryPreferenceGroupStore implements PrimaryPreferenceGroupStore {
  inner: PrimaryPreferenceGroupStore;
  cache: cache.TtlCache<PrimaryPreferenceGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryPreferenceGroupStore,
    cacheValue: cache.TtlCache<PrimaryPreferenceGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryPreferenceGroup | undefined {
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

  save(item: PrimaryPreferenceGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryPreferenceGroup[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryPreferenceGroupStore(inner: PrimaryPreferenceGroupStore, ttl: number, clockValue: clock.Clock): PrimaryPreferenceGroupStore {
  return new CachedPrimaryPreferenceGroupStore(
    inner,
    cache.newTtlCache<PrimaryPreferenceGroup>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary preference groups. Empty fields match all. */
export class PrimaryPreferenceGroupQuery {
  title: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minLimit: number, statuses: string[], limit: number) {
    this.title = title;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryPreferenceGroup): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryPreferenceGroup[]): PrimaryPreferenceGroup[] {
    const matched = collections.filter(items, (candidate: PrimaryPreferenceGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryPreferenceGroups(store: PrimaryPreferenceGroupStore, query: PrimaryPreferenceGroupQuery): PrimaryPreferenceGroup[] {
  return query.apply(store.list());
}
