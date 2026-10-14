import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardRuleCycle } from "./reward-rule-cycle.js";

/** Keeps reward rule cycles by code. */
export interface RewardRuleCycleStore {
  find(code: string): RewardRuleCycle | undefined;
  save(item: RewardRuleCycle): void;
  remove(code: string): boolean;
  list(): RewardRuleCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardRuleCycleStore implements RewardRuleCycleStore {
  items: Map<string, RewardRuleCycle>;
  order: string[];

  constructor(items: Map<string, RewardRuleCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardRuleCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardRuleCycle): void {
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

  list(): RewardRuleCycle[] {
    const out: RewardRuleCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardRuleCycleStore(): RewardRuleCycleStore {
  return new MemoryRewardRuleCycleStore(new Map<string, RewardRuleCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardRuleCycleStore implements RewardRuleCycleStore {
  inner: RewardRuleCycleStore;
  cache: cache.TtlCache<RewardRuleCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardRuleCycleStore,
    cacheValue: cache.TtlCache<RewardRuleCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardRuleCycle | undefined {
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

  save(item: RewardRuleCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardRuleCycle[] {
    return this.inner.list();
  }
}

export function newCachedRewardRuleCycleStore(inner: RewardRuleCycleStore, ttl: number, clockValue: clock.Clock): RewardRuleCycleStore {
  return new CachedRewardRuleCycleStore(inner, cache.newTtlCache<RewardRuleCycle>(64, ttl, clockValue), 0, 0);
}

/** Selects reward rule cycles. Empty fields match all. */
export class RewardRuleCycleQuery {
  segment: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minMaximum: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardRuleCycle): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardRuleCycle[]): RewardRuleCycle[] {
    const matched = collections.filter(items, (candidate: RewardRuleCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardRuleCycles(store: RewardRuleCycleStore, query: RewardRuleCycleQuery): RewardRuleCycle[] {
  return query.apply(store.list());
}
