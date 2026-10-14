import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardRuleDraft } from "./reward-rule-draft.js";

/** Keeps reward rule drafts by code. */
export interface RewardRuleDraftStore {
  find(code: string): RewardRuleDraft | undefined;
  save(item: RewardRuleDraft): void;
  remove(code: string): boolean;
  list(): RewardRuleDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardRuleDraftStore implements RewardRuleDraftStore {
  items: Map<string, RewardRuleDraft>;
  order: string[];

  constructor(items: Map<string, RewardRuleDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardRuleDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardRuleDraft): void {
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

  list(): RewardRuleDraft[] {
    const out: RewardRuleDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardRuleDraftStore(): RewardRuleDraftStore {
  return new MemoryRewardRuleDraftStore(new Map<string, RewardRuleDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardRuleDraftStore implements RewardRuleDraftStore {
  inner: RewardRuleDraftStore;
  cache: cache.TtlCache<RewardRuleDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardRuleDraftStore,
    cacheValue: cache.TtlCache<RewardRuleDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardRuleDraft | undefined {
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

  save(item: RewardRuleDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardRuleDraft[] {
    return this.inner.list();
  }
}

export function newCachedRewardRuleDraftStore(inner: RewardRuleDraftStore, ttl: number, clockValue: clock.Clock): RewardRuleDraftStore {
  return new CachedRewardRuleDraftStore(inner, cache.newTtlCache<RewardRuleDraft>(512, ttl, clockValue), 0, 0);
}

/** Selects reward rule drafts. Empty fields match all. */
export class RewardRuleDraftQuery {
  name: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minStartsAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardRuleDraft): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardRuleDraft[]): RewardRuleDraft[] {
    const matched = collections.filter(items, (candidate: RewardRuleDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardRuleDrafts(store: RewardRuleDraftStore, query: RewardRuleDraftQuery): RewardRuleDraft[] {
  return query.apply(store.list());
}
