import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardProfile } from "./reward-profile.js";

/** Keeps reward profiles by code. */
export interface RewardProfileStore {
  find(code: string): RewardProfile | undefined;
  save(item: RewardProfile): void;
  remove(code: string): boolean;
  list(): RewardProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardProfileStore implements RewardProfileStore {
  items: Map<string, RewardProfile>;
  order: string[];

  constructor(items: Map<string, RewardProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardProfile): void {
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

  list(): RewardProfile[] {
    const out: RewardProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardProfileStore(): RewardProfileStore {
  return new MemoryRewardProfileStore(new Map<string, RewardProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardProfileStore implements RewardProfileStore {
  inner: RewardProfileStore;
  cache: cache.TtlCache<RewardProfile>;
  hits: number;
  misses: number;

  constructor(inner: RewardProfileStore, cacheValue: cache.TtlCache<RewardProfile>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardProfile | undefined {
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

  save(item: RewardProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardProfile[] {
    return this.inner.list();
  }
}

export function newCachedRewardProfileStore(inner: RewardProfileStore, ttl: number, clockValue: clock.Clock): RewardProfileStore {
  return new CachedRewardProfileStore(inner, cache.newTtlCache<RewardProfile>(512, ttl, clockValue), 0, 0);
}

/** Selects reward profiles. Empty fields match all. */
export class RewardProfileQuery {
  category: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.category = category;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardProfile): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardProfile[]): RewardProfile[] {
    const matched = collections.filter(items, (candidate: RewardProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardProfiles(store: RewardProfileStore, query: RewardProfileQuery): RewardProfile[] {
  return query.apply(store.list());
}
