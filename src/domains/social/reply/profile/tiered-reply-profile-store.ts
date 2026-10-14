import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredReplyProfile } from "./tiered-reply-profile.js";

/** Keeps tiered reply profiles by code. */
export interface TieredReplyProfileStore {
  find(code: string): TieredReplyProfile | undefined;
  save(item: TieredReplyProfile): void;
  remove(code: string): boolean;
  list(): TieredReplyProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredReplyProfileStore implements TieredReplyProfileStore {
  items: Map<string, TieredReplyProfile>;
  order: string[];

  constructor(items: Map<string, TieredReplyProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredReplyProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredReplyProfile): void {
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

  list(): TieredReplyProfile[] {
    const out: TieredReplyProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredReplyProfileStore(): TieredReplyProfileStore {
  return new MemoryTieredReplyProfileStore(new Map<string, TieredReplyProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredReplyProfileStore implements TieredReplyProfileStore {
  inner: TieredReplyProfileStore;
  cache: cache.TtlCache<TieredReplyProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredReplyProfileStore,
    cacheValue: cache.TtlCache<TieredReplyProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredReplyProfile | undefined {
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

  save(item: TieredReplyProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredReplyProfile[] {
    return this.inner.list();
  }
}

export function newCachedTieredReplyProfileStore(inner: TieredReplyProfileStore, ttl: number, clockValue: clock.Clock): TieredReplyProfileStore {
  return new CachedTieredReplyProfileStore(inner, cache.newTtlCache<TieredReplyProfile>(1024, ttl, clockValue), 0, 0);
}

/** Selects tiered reply profiles. Empty fields match all. */
export class TieredReplyProfileQuery {
  category: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minBatchSize: number, statuses: string[], limit: number) {
    this.category = category;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredReplyProfile): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredReplyProfile[]): TieredReplyProfile[] {
    const matched = collections.filter(items, (candidate: TieredReplyProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredReplyProfiles(store: TieredReplyProfileStore, query: TieredReplyProfileQuery): TieredReplyProfile[] {
  return query.apply(store.list());
}
