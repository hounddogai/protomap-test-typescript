import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardRuleDigest } from "./reward-rule-digest.js";

/** Keeps reward rule digests by code. */
export interface RewardRuleDigestStore {
  find(code: string): RewardRuleDigest | undefined;
  save(item: RewardRuleDigest): void;
  remove(code: string): boolean;
  list(): RewardRuleDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardRuleDigestStore implements RewardRuleDigestStore {
  items: Map<string, RewardRuleDigest>;
  order: string[];

  constructor(items: Map<string, RewardRuleDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardRuleDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardRuleDigest): void {
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

  list(): RewardRuleDigest[] {
    const out: RewardRuleDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardRuleDigestStore(): RewardRuleDigestStore {
  return new MemoryRewardRuleDigestStore(new Map<string, RewardRuleDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardRuleDigestStore implements RewardRuleDigestStore {
  inner: RewardRuleDigestStore;
  cache: cache.TtlCache<RewardRuleDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardRuleDigestStore,
    cacheValue: cache.TtlCache<RewardRuleDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardRuleDigest | undefined {
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

  save(item: RewardRuleDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardRuleDigest[] {
    return this.inner.list();
  }
}

export function newCachedRewardRuleDigestStore(inner: RewardRuleDigestStore, ttl: number, clockValue: clock.Clock): RewardRuleDigestStore {
  return new CachedRewardRuleDigestStore(inner, cache.newTtlCache<RewardRuleDigest>(128, ttl, clockValue), 0, 0);
}

/** Selects reward rule digests. Empty fields match all. */
export class RewardRuleDigestQuery {
  title: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCost: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardRuleDigest): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardRuleDigest[]): RewardRuleDigest[] {
    const matched = collections.filter(items, (candidate: RewardRuleDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardRuleDigests(store: RewardRuleDigestStore, query: RewardRuleDigestQuery): RewardRuleDigest[] {
  return query.apply(store.list());
}
