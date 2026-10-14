import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FrequencyGroup } from "./frequency-group.js";

/** Keeps frequency groups by code. */
export interface FrequencyGroupStore {
  find(code: string): FrequencyGroup | undefined;
  save(item: FrequencyGroup): void;
  remove(code: string): boolean;
  list(): FrequencyGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFrequencyGroupStore implements FrequencyGroupStore {
  items: Map<string, FrequencyGroup>;
  order: string[];

  constructor(items: Map<string, FrequencyGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FrequencyGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FrequencyGroup): void {
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

  list(): FrequencyGroup[] {
    const out: FrequencyGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFrequencyGroupStore(): FrequencyGroupStore {
  return new MemoryFrequencyGroupStore(new Map<string, FrequencyGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFrequencyGroupStore implements FrequencyGroupStore {
  inner: FrequencyGroupStore;
  cache: cache.TtlCache<FrequencyGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: FrequencyGroupStore,
    cacheValue: cache.TtlCache<FrequencyGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FrequencyGroup | undefined {
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

  save(item: FrequencyGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FrequencyGroup[] {
    return this.inner.list();
  }
}

export function newCachedFrequencyGroupStore(inner: FrequencyGroupStore, ttl: number, clockValue: clock.Clock): FrequencyGroupStore {
  return new CachedFrequencyGroupStore(inner, cache.newTtlCache<FrequencyGroup>(64, ttl, clockValue), 0, 0);
}

/** Selects frequency groups. Empty fields match all. */
export class FrequencyGroupQuery {
  locale: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minPriority: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FrequencyGroup): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FrequencyGroup[]): FrequencyGroup[] {
    const matched = collections.filter(items, (candidate: FrequencyGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFrequencyGroups(store: FrequencyGroupStore, query: FrequencyGroupQuery): FrequencyGroup[] {
  return query.apply(store.list());
}
