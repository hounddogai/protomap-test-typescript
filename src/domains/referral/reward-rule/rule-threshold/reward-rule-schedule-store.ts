import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardRuleSchedule } from "./reward-rule-schedule.js";

/** Keeps reward rule schedules by code. */
export interface RewardRuleScheduleStore {
  find(code: string): RewardRuleSchedule | undefined;
  save(item: RewardRuleSchedule): void;
  remove(code: string): boolean;
  list(): RewardRuleSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardRuleScheduleStore implements RewardRuleScheduleStore {
  items: Map<string, RewardRuleSchedule>;
  order: string[];

  constructor(items: Map<string, RewardRuleSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardRuleSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardRuleSchedule): void {
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

  list(): RewardRuleSchedule[] {
    const out: RewardRuleSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardRuleScheduleStore(): RewardRuleScheduleStore {
  return new MemoryRewardRuleScheduleStore(new Map<string, RewardRuleSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardRuleScheduleStore implements RewardRuleScheduleStore {
  inner: RewardRuleScheduleStore;
  cache: cache.TtlCache<RewardRuleSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardRuleScheduleStore,
    cacheValue: cache.TtlCache<RewardRuleSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardRuleSchedule | undefined {
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

  save(item: RewardRuleSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardRuleSchedule[] {
    return this.inner.list();
  }
}

export function newCachedRewardRuleScheduleStore(inner: RewardRuleScheduleStore, ttl: number, clockValue: clock.Clock): RewardRuleScheduleStore {
  return new CachedRewardRuleScheduleStore(inner, cache.newTtlCache<RewardRuleSchedule>(256, ttl, clockValue), 0, 0);
}

/** Selects reward rule schedules. Empty fields match all. */
export class RewardRuleScheduleQuery {
  name: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minAmount: number, statuses: string[], limit: number) {
    this.name = name;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardRuleSchedule): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardRuleSchedule[]): RewardRuleSchedule[] {
    const matched = collections.filter(items, (candidate: RewardRuleSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardRuleSchedules(store: RewardRuleScheduleStore, query: RewardRuleScheduleQuery): RewardRuleSchedule[] {
  return query.apply(store.list());
}
