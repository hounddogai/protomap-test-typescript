import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardRulePreference } from "./reward-rule-preference.js";

/** Keeps reward rule preferences by code. */
export interface RewardRulePreferenceStore {
  find(code: string): RewardRulePreference | undefined;
  save(item: RewardRulePreference): void;
  remove(code: string): boolean;
  list(): RewardRulePreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardRulePreferenceStore implements RewardRulePreferenceStore {
  items: Map<string, RewardRulePreference>;
  order: string[];

  constructor(items: Map<string, RewardRulePreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardRulePreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardRulePreference): void {
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

  list(): RewardRulePreference[] {
    const out: RewardRulePreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardRulePreferenceStore(): RewardRulePreferenceStore {
  return new MemoryRewardRulePreferenceStore(new Map<string, RewardRulePreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardRulePreferenceStore implements RewardRulePreferenceStore {
  inner: RewardRulePreferenceStore;
  cache: cache.TtlCache<RewardRulePreference>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardRulePreferenceStore,
    cacheValue: cache.TtlCache<RewardRulePreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardRulePreference | undefined {
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

  save(item: RewardRulePreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardRulePreference[] {
    return this.inner.list();
  }
}

export function newCachedRewardRulePreferenceStore(inner: RewardRulePreferenceStore, ttl: number, clockValue: clock.Clock): RewardRulePreferenceStore {
  return new CachedRewardRulePreferenceStore(
    inner,
    cache.newTtlCache<RewardRulePreference>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects reward rule preferences. Empty fields match all. */
export class RewardRulePreferenceQuery {
  source: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minThreshold: number, statuses: string[], limit: number) {
    this.source = source;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardRulePreference): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardRulePreference[]): RewardRulePreference[] {
    const matched = collections.filter(items, (candidate: RewardRulePreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardRulePreferences(store: RewardRulePreferenceStore, query: RewardRulePreferenceQuery): RewardRulePreference[] {
  return query.apply(store.list());
}
