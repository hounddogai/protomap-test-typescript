import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardRuleWindow } from "./reward-rule-window.js";

/** Keeps reward rule windows by code. */
export interface RewardRuleWindowStore {
  find(code: string): RewardRuleWindow | undefined;
  save(item: RewardRuleWindow): void;
  remove(code: string): boolean;
  list(): RewardRuleWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardRuleWindowStore implements RewardRuleWindowStore {
  items: Map<string, RewardRuleWindow>;
  order: string[];

  constructor(items: Map<string, RewardRuleWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardRuleWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardRuleWindow): void {
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

  list(): RewardRuleWindow[] {
    const out: RewardRuleWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardRuleWindowStore(): RewardRuleWindowStore {
  return new MemoryRewardRuleWindowStore(new Map<string, RewardRuleWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardRuleWindowStore implements RewardRuleWindowStore {
  inner: RewardRuleWindowStore;
  cache: cache.TtlCache<RewardRuleWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardRuleWindowStore,
    cacheValue: cache.TtlCache<RewardRuleWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardRuleWindow | undefined {
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

  save(item: RewardRuleWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardRuleWindow[] {
    return this.inner.list();
  }
}

export function newCachedRewardRuleWindowStore(inner: RewardRuleWindowStore, ttl: number, clockValue: clock.Clock): RewardRuleWindowStore {
  return new CachedRewardRuleWindowStore(inner, cache.newTtlCache<RewardRuleWindow>(1024, ttl, clockValue), 0, 0);
}

/** Selects reward rule windows. Empty fields match all. */
export class RewardRuleWindowQuery {
  channel: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minClicks: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardRuleWindow): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardRuleWindow[]): RewardRuleWindow[] {
    const matched = collections.filter(items, (candidate: RewardRuleWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardRuleWindows(store: RewardRuleWindowStore, query: RewardRuleWindowQuery): RewardRuleWindow[] {
  return query.apply(store.list());
}
