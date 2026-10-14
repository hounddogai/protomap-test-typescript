import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedRewardRulePreference } from "./weighted-reward-rule-preference.js";

/** Keeps weighted reward rule preferences by code. */
export interface WeightedRewardRulePreferenceStore {
  find(code: string): WeightedRewardRulePreference | undefined;
  save(item: WeightedRewardRulePreference): void;
  remove(code: string): boolean;
  list(): WeightedRewardRulePreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedRewardRulePreferenceStore implements WeightedRewardRulePreferenceStore {
  items: Map<string, WeightedRewardRulePreference>;
  order: string[];

  constructor(items: Map<string, WeightedRewardRulePreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedRewardRulePreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedRewardRulePreference): void {
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

  list(): WeightedRewardRulePreference[] {
    const out: WeightedRewardRulePreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedRewardRulePreferenceStore(): WeightedRewardRulePreferenceStore {
  return new MemoryWeightedRewardRulePreferenceStore(new Map<string, WeightedRewardRulePreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedRewardRulePreferenceStore implements WeightedRewardRulePreferenceStore {
  inner: WeightedRewardRulePreferenceStore;
  cache: cache.TtlCache<WeightedRewardRulePreference>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedRewardRulePreferenceStore,
    cacheValue: cache.TtlCache<WeightedRewardRulePreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedRewardRulePreference | undefined {
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

  save(item: WeightedRewardRulePreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedRewardRulePreference[] {
    return this.inner.list();
  }
}

export function newCachedWeightedRewardRulePreferenceStore(inner: WeightedRewardRulePreferenceStore, ttl: number, clockValue: clock.Clock): WeightedRewardRulePreferenceStore {
  return new CachedWeightedRewardRulePreferenceStore(
    inner,
    cache.newTtlCache<WeightedRewardRulePreference>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted reward rule preferences. Empty fields match all. */
export class WeightedRewardRulePreferenceQuery {
  title: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedRewardRulePreference): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedRewardRulePreference[]): WeightedRewardRulePreference[] {
    const matched = collections.filter(items, (candidate: WeightedRewardRulePreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedRewardRulePreferences(store: WeightedRewardRulePreferenceStore, query: WeightedRewardRulePreferenceQuery): WeightedRewardRulePreference[] {
  return query.apply(store.list());
}
