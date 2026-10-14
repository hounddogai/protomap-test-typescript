import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardRuleRequest } from "./reward-rule-request.js";

/** Keeps reward rule requests by code. */
export interface RewardRuleRequestStore {
  find(code: string): RewardRuleRequest | undefined;
  save(item: RewardRuleRequest): void;
  remove(code: string): boolean;
  list(): RewardRuleRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardRuleRequestStore implements RewardRuleRequestStore {
  items: Map<string, RewardRuleRequest>;
  order: string[];

  constructor(items: Map<string, RewardRuleRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardRuleRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardRuleRequest): void {
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

  list(): RewardRuleRequest[] {
    const out: RewardRuleRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardRuleRequestStore(): RewardRuleRequestStore {
  return new MemoryRewardRuleRequestStore(new Map<string, RewardRuleRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardRuleRequestStore implements RewardRuleRequestStore {
  inner: RewardRuleRequestStore;
  cache: cache.TtlCache<RewardRuleRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardRuleRequestStore,
    cacheValue: cache.TtlCache<RewardRuleRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardRuleRequest | undefined {
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

  save(item: RewardRuleRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardRuleRequest[] {
    return this.inner.list();
  }
}

export function newCachedRewardRuleRequestStore(inner: RewardRuleRequestStore, ttl: number, clockValue: clock.Clock): RewardRuleRequestStore {
  return new CachedRewardRuleRequestStore(inner, cache.newTtlCache<RewardRuleRequest>(128, ttl, clockValue), 0, 0);
}

/** Selects reward rule requests. Empty fields match all. */
export class RewardRuleRequestQuery {
  locale: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minGraceDays: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardRuleRequest): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardRuleRequest[]): RewardRuleRequest[] {
    const matched = collections.filter(items, (candidate: RewardRuleRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardRuleRequests(store: RewardRuleRequestStore, query: RewardRuleRequestQuery): RewardRuleRequest[] {
  return query.apply(store.list());
}
