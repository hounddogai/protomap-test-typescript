import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveRetentionGroup } from "./adaptive-retention-group.js";

/** Keeps adaptive retention groups by code. */
export interface AdaptiveRetentionGroupStore {
  find(code: string): AdaptiveRetentionGroup | undefined;
  save(item: AdaptiveRetentionGroup): void;
  remove(code: string): boolean;
  list(): AdaptiveRetentionGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveRetentionGroupStore implements AdaptiveRetentionGroupStore {
  items: Map<string, AdaptiveRetentionGroup>;
  order: string[];

  constructor(items: Map<string, AdaptiveRetentionGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveRetentionGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveRetentionGroup): void {
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

  list(): AdaptiveRetentionGroup[] {
    const out: AdaptiveRetentionGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveRetentionGroupStore(): AdaptiveRetentionGroupStore {
  return new MemoryAdaptiveRetentionGroupStore(new Map<string, AdaptiveRetentionGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveRetentionGroupStore implements AdaptiveRetentionGroupStore {
  inner: AdaptiveRetentionGroupStore;
  cache: cache.TtlCache<AdaptiveRetentionGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveRetentionGroupStore,
    cacheValue: cache.TtlCache<AdaptiveRetentionGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveRetentionGroup | undefined {
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

  save(item: AdaptiveRetentionGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveRetentionGroup[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveRetentionGroupStore(inner: AdaptiveRetentionGroupStore, ttl: number, clockValue: clock.Clock): AdaptiveRetentionGroupStore {
  return new CachedAdaptiveRetentionGroupStore(
    inner,
    cache.newTtlCache<AdaptiveRetentionGroup>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive retention groups. Empty fields match all. */
export class AdaptiveRetentionGroupQuery {
  segment: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minPriority: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveRetentionGroup): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveRetentionGroup[]): AdaptiveRetentionGroup[] {
    const matched = collections.filter(items, (candidate: AdaptiveRetentionGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveRetentionGroups(store: AdaptiveRetentionGroupStore, query: AdaptiveRetentionGroupQuery): AdaptiveRetentionGroup[] {
  return query.apply(store.list());
}
