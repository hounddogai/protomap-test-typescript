import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardPolicy } from "./reward-policy.js";

/** Keeps reward policies by code. */
export interface RewardPolicyStore {
  find(code: string): RewardPolicy | undefined;
  save(item: RewardPolicy): void;
  remove(code: string): boolean;
  list(): RewardPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardPolicyStore implements RewardPolicyStore {
  items: Map<string, RewardPolicy>;
  order: string[];

  constructor(items: Map<string, RewardPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardPolicy): void {
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

  list(): RewardPolicy[] {
    const out: RewardPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardPolicyStore(): RewardPolicyStore {
  return new MemoryRewardPolicyStore(new Map<string, RewardPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardPolicyStore implements RewardPolicyStore {
  inner: RewardPolicyStore;
  cache: cache.TtlCache<RewardPolicy>;
  hits: number;
  misses: number;

  constructor(inner: RewardPolicyStore, cacheValue: cache.TtlCache<RewardPolicy>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardPolicy | undefined {
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

  save(item: RewardPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardPolicy[] {
    return this.inner.list();
  }
}

export function newCachedRewardPolicyStore(inner: RewardPolicyStore, ttl: number, clockValue: clock.Clock): RewardPolicyStore {
  return new CachedRewardPolicyStore(inner, cache.newTtlCache<RewardPolicy>(1024, ttl, clockValue), 0, 0);
}

/** Selects reward policies. Empty fields match all. */
export class RewardPolicyQuery {
  name: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardPolicy): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardPolicy[]): RewardPolicy[] {
    const matched = collections.filter(items, (candidate: RewardPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardPolicies(store: RewardPolicyStore, query: RewardPolicyQuery): RewardPolicy[] {
  return query.apply(store.list());
}
