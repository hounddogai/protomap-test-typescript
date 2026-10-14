import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictRewardRulePreference } from "./strict-reward-rule-preference.js";

/** Keeps strict reward rule preferences by code. */
export interface StrictRewardRulePreferenceStore {
  find(code: string): StrictRewardRulePreference | undefined;
  save(item: StrictRewardRulePreference): void;
  remove(code: string): boolean;
  list(): StrictRewardRulePreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictRewardRulePreferenceStore implements StrictRewardRulePreferenceStore {
  items: Map<string, StrictRewardRulePreference>;
  order: string[];

  constructor(items: Map<string, StrictRewardRulePreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictRewardRulePreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictRewardRulePreference): void {
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

  list(): StrictRewardRulePreference[] {
    const out: StrictRewardRulePreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictRewardRulePreferenceStore(): StrictRewardRulePreferenceStore {
  return new MemoryStrictRewardRulePreferenceStore(new Map<string, StrictRewardRulePreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictRewardRulePreferenceStore implements StrictRewardRulePreferenceStore {
  inner: StrictRewardRulePreferenceStore;
  cache: cache.TtlCache<StrictRewardRulePreference>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictRewardRulePreferenceStore,
    cacheValue: cache.TtlCache<StrictRewardRulePreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictRewardRulePreference | undefined {
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

  save(item: StrictRewardRulePreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictRewardRulePreference[] {
    return this.inner.list();
  }
}

export function newCachedStrictRewardRulePreferenceStore(inner: StrictRewardRulePreferenceStore, ttl: number, clockValue: clock.Clock): StrictRewardRulePreferenceStore {
  return new CachedStrictRewardRulePreferenceStore(
    inner,
    cache.newTtlCache<StrictRewardRulePreference>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict reward rule preferences. Empty fields match all. */
export class StrictRewardRulePreferenceQuery {
  label: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minOpenRate: number, statuses: string[], limit: number) {
    this.label = label;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictRewardRulePreference): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictRewardRulePreference[]): StrictRewardRulePreference[] {
    const matched = collections.filter(items, (candidate: StrictRewardRulePreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictRewardRulePreferences(store: StrictRewardRulePreferenceStore, query: StrictRewardRulePreferenceQuery): StrictRewardRulePreference[] {
  return query.apply(store.list());
}
