import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledRewardTarget } from "./scheduled-reward-target.js";

/** Keeps scheduled reward targets by code. */
export interface ScheduledRewardTargetStore {
  find(code: string): ScheduledRewardTarget | undefined;
  save(item: ScheduledRewardTarget): void;
  remove(code: string): boolean;
  list(): ScheduledRewardTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledRewardTargetStore implements ScheduledRewardTargetStore {
  items: Map<string, ScheduledRewardTarget>;
  order: string[];

  constructor(items: Map<string, ScheduledRewardTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledRewardTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledRewardTarget): void {
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

  list(): ScheduledRewardTarget[] {
    const out: ScheduledRewardTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledRewardTargetStore(): ScheduledRewardTargetStore {
  return new MemoryScheduledRewardTargetStore(new Map<string, ScheduledRewardTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledRewardTargetStore implements ScheduledRewardTargetStore {
  inner: ScheduledRewardTargetStore;
  cache: cache.TtlCache<ScheduledRewardTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledRewardTargetStore,
    cacheValue: cache.TtlCache<ScheduledRewardTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledRewardTarget | undefined {
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

  save(item: ScheduledRewardTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledRewardTarget[] {
    return this.inner.list();
  }
}

export function newCachedScheduledRewardTargetStore(inner: ScheduledRewardTargetStore, ttl: number, clockValue: clock.Clock): ScheduledRewardTargetStore {
  return new CachedScheduledRewardTargetStore(
    inner,
    cache.newTtlCache<ScheduledRewardTarget>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled reward targets. Empty fields match all. */
export class ScheduledRewardTargetQuery {
  locale: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minQuantity: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledRewardTarget): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledRewardTarget[]): ScheduledRewardTarget[] {
    const matched = collections.filter(items, (candidate: ScheduledRewardTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledRewardTargets(store: ScheduledRewardTargetStore, query: ScheduledRewardTargetQuery): ScheduledRewardTarget[] {
  return query.apply(store.list());
}
