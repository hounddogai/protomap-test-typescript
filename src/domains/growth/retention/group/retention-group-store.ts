import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RetentionGroup } from "./retention-group.js";

/** Keeps retention groups by code. */
export interface RetentionGroupStore {
  find(code: string): RetentionGroup | undefined;
  save(item: RetentionGroup): void;
  remove(code: string): boolean;
  list(): RetentionGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRetentionGroupStore implements RetentionGroupStore {
  items: Map<string, RetentionGroup>;
  order: string[];

  constructor(items: Map<string, RetentionGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RetentionGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RetentionGroup): void {
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

  list(): RetentionGroup[] {
    const out: RetentionGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRetentionGroupStore(): RetentionGroupStore {
  return new MemoryRetentionGroupStore(new Map<string, RetentionGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRetentionGroupStore implements RetentionGroupStore {
  inner: RetentionGroupStore;
  cache: cache.TtlCache<RetentionGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: RetentionGroupStore,
    cacheValue: cache.TtlCache<RetentionGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RetentionGroup | undefined {
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

  save(item: RetentionGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RetentionGroup[] {
    return this.inner.list();
  }
}

export function newCachedRetentionGroupStore(inner: RetentionGroupStore, ttl: number, clockValue: clock.Clock): RetentionGroupStore {
  return new CachedRetentionGroupStore(inner, cache.newTtlCache<RetentionGroup>(1024, ttl, clockValue), 0, 0);
}

/** Selects retention groups. Empty fields match all. */
export class RetentionGroupQuery {
  name: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minMaximum: number, statuses: string[], limit: number) {
    this.name = name;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RetentionGroup): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RetentionGroup[]): RetentionGroup[] {
    const matched = collections.filter(items, (candidate: RetentionGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRetentionGroups(store: RetentionGroupStore, query: RetentionGroupQuery): RetentionGroup[] {
  return query.apply(store.list());
}
