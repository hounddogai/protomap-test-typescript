import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardDraft } from "./reward-draft.js";

/** Keeps reward drafts by code. */
export interface RewardDraftStore {
  find(code: string): RewardDraft | undefined;
  save(item: RewardDraft): void;
  remove(code: string): boolean;
  list(): RewardDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardDraftStore implements RewardDraftStore {
  items: Map<string, RewardDraft>;
  order: string[];

  constructor(items: Map<string, RewardDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardDraft): void {
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

  list(): RewardDraft[] {
    const out: RewardDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardDraftStore(): RewardDraftStore {
  return new MemoryRewardDraftStore(new Map<string, RewardDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardDraftStore implements RewardDraftStore {
  inner: RewardDraftStore;
  cache: cache.TtlCache<RewardDraft>;
  hits: number;
  misses: number;

  constructor(inner: RewardDraftStore, cacheValue: cache.TtlCache<RewardDraft>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardDraft | undefined {
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

  save(item: RewardDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardDraft[] {
    return this.inner.list();
  }
}

export function newCachedRewardDraftStore(inner: RewardDraftStore, ttl: number, clockValue: clock.Clock): RewardDraftStore {
  return new CachedRewardDraftStore(inner, cache.newTtlCache<RewardDraft>(64, ttl, clockValue), 0, 0);
}

/** Selects reward drafts. Empty fields match all. */
export class RewardDraftQuery {
  title: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minBatchSize: number, statuses: string[], limit: number) {
    this.title = title;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardDraft): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardDraft[]): RewardDraft[] {
    const matched = collections.filter(items, (candidate: RewardDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardDrafts(store: RewardDraftStore, query: RewardDraftQuery): RewardDraft[] {
  return query.apply(store.list());
}
