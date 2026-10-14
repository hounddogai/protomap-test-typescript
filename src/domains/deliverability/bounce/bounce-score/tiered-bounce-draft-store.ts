import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredBounceDraft } from "./tiered-bounce-draft.js";

/** Keeps tiered bounce drafts by code. */
export interface TieredBounceDraftStore {
  find(code: string): TieredBounceDraft | undefined;
  save(item: TieredBounceDraft): void;
  remove(code: string): boolean;
  list(): TieredBounceDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredBounceDraftStore implements TieredBounceDraftStore {
  items: Map<string, TieredBounceDraft>;
  order: string[];

  constructor(items: Map<string, TieredBounceDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredBounceDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredBounceDraft): void {
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

  list(): TieredBounceDraft[] {
    const out: TieredBounceDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredBounceDraftStore(): TieredBounceDraftStore {
  return new MemoryTieredBounceDraftStore(new Map<string, TieredBounceDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredBounceDraftStore implements TieredBounceDraftStore {
  inner: TieredBounceDraftStore;
  cache: cache.TtlCache<TieredBounceDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredBounceDraftStore,
    cacheValue: cache.TtlCache<TieredBounceDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredBounceDraft | undefined {
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

  save(item: TieredBounceDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredBounceDraft[] {
    return this.inner.list();
  }
}

export function newCachedTieredBounceDraftStore(inner: TieredBounceDraftStore, ttl: number, clockValue: clock.Clock): TieredBounceDraftStore {
  return new CachedTieredBounceDraftStore(inner, cache.newTtlCache<TieredBounceDraft>(128, ttl, clockValue), 0, 0);
}

/** Selects tiered bounce drafts. Empty fields match all. */
export class TieredBounceDraftQuery {
  channel: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minScore: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredBounceDraft): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredBounceDraft[]): TieredBounceDraft[] {
    const matched = collections.filter(items, (candidate: TieredBounceDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredBounceDrafts(store: TieredBounceDraftStore, query: TieredBounceDraftQuery): TieredBounceDraft[] {
  return query.apply(store.list());
}
