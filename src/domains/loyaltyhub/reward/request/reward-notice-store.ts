import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardNotice } from "./reward-notice.js";

/** Keeps reward notices by code. */
export interface RewardNoticeStore {
  find(code: string): RewardNotice | undefined;
  save(item: RewardNotice): void;
  remove(code: string): boolean;
  list(): RewardNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardNoticeStore implements RewardNoticeStore {
  items: Map<string, RewardNotice>;
  order: string[];

  constructor(items: Map<string, RewardNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardNotice): void {
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

  list(): RewardNotice[] {
    const out: RewardNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardNoticeStore(): RewardNoticeStore {
  return new MemoryRewardNoticeStore(new Map<string, RewardNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardNoticeStore implements RewardNoticeStore {
  inner: RewardNoticeStore;
  cache: cache.TtlCache<RewardNotice>;
  hits: number;
  misses: number;

  constructor(inner: RewardNoticeStore, cacheValue: cache.TtlCache<RewardNotice>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardNotice | undefined {
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

  save(item: RewardNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardNotice[] {
    return this.inner.list();
  }
}

export function newCachedRewardNoticeStore(inner: RewardNoticeStore, ttl: number, clockValue: clock.Clock): RewardNoticeStore {
  return new CachedRewardNoticeStore(inner, cache.newTtlCache<RewardNotice>(256, ttl, clockValue), 0, 0);
}

/** Selects reward notices. Empty fields match all. */
export class RewardNoticeQuery {
  unit: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minAttempts: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardNotice): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardNotice[]): RewardNotice[] {
    const matched = collections.filter(items, (candidate: RewardNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardNotices(store: RewardNoticeStore, query: RewardNoticeQuery): RewardNotice[] {
  return query.apply(store.list());
}
