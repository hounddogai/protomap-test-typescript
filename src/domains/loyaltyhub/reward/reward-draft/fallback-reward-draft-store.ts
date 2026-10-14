import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackRewardDraft } from "./fallback-reward-draft.js";

/** Keeps fallback reward drafts by code. */
export interface FallbackRewardDraftStore {
  find(code: string): FallbackRewardDraft | undefined;
  save(item: FallbackRewardDraft): void;
  remove(code: string): boolean;
  list(): FallbackRewardDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackRewardDraftStore implements FallbackRewardDraftStore {
  items: Map<string, FallbackRewardDraft>;
  order: string[];

  constructor(items: Map<string, FallbackRewardDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackRewardDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackRewardDraft): void {
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

  list(): FallbackRewardDraft[] {
    const out: FallbackRewardDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackRewardDraftStore(): FallbackRewardDraftStore {
  return new MemoryFallbackRewardDraftStore(new Map<string, FallbackRewardDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackRewardDraftStore implements FallbackRewardDraftStore {
  inner: FallbackRewardDraftStore;
  cache: cache.TtlCache<FallbackRewardDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackRewardDraftStore,
    cacheValue: cache.TtlCache<FallbackRewardDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackRewardDraft | undefined {
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

  save(item: FallbackRewardDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackRewardDraft[] {
    return this.inner.list();
  }
}

export function newCachedFallbackRewardDraftStore(inner: FallbackRewardDraftStore, ttl: number, clockValue: clock.Clock): FallbackRewardDraftStore {
  return new CachedFallbackRewardDraftStore(inner, cache.newTtlCache<FallbackRewardDraft>(512, ttl, clockValue), 0, 0);
}

/** Selects fallback reward drafts. Empty fields match all. */
export class FallbackRewardDraftQuery {
  segment: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minThreshold: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackRewardDraft): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackRewardDraft[]): FallbackRewardDraft[] {
    const matched = collections.filter(items, (candidate: FallbackRewardDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackRewardDrafts(store: FallbackRewardDraftStore, query: FallbackRewardDraftQuery): FallbackRewardDraft[] {
  return query.apply(store.list());
}
