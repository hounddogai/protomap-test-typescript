import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualRewardRulePreference } from "./manual-reward-rule-preference.js";

/** Keeps manual reward rule preferences by code. */
export interface ManualRewardRulePreferenceStore {
  find(code: string): ManualRewardRulePreference | undefined;
  save(item: ManualRewardRulePreference): void;
  remove(code: string): boolean;
  list(): ManualRewardRulePreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualRewardRulePreferenceStore implements ManualRewardRulePreferenceStore {
  items: Map<string, ManualRewardRulePreference>;
  order: string[];

  constructor(items: Map<string, ManualRewardRulePreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualRewardRulePreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualRewardRulePreference): void {
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

  list(): ManualRewardRulePreference[] {
    const out: ManualRewardRulePreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualRewardRulePreferenceStore(): ManualRewardRulePreferenceStore {
  return new MemoryManualRewardRulePreferenceStore(new Map<string, ManualRewardRulePreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualRewardRulePreferenceStore implements ManualRewardRulePreferenceStore {
  inner: ManualRewardRulePreferenceStore;
  cache: cache.TtlCache<ManualRewardRulePreference>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualRewardRulePreferenceStore,
    cacheValue: cache.TtlCache<ManualRewardRulePreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualRewardRulePreference | undefined {
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

  save(item: ManualRewardRulePreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualRewardRulePreference[] {
    return this.inner.list();
  }
}

export function newCachedManualRewardRulePreferenceStore(inner: ManualRewardRulePreferenceStore, ttl: number, clockValue: clock.Clock): ManualRewardRulePreferenceStore {
  return new CachedManualRewardRulePreferenceStore(
    inner,
    cache.newTtlCache<ManualRewardRulePreference>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual reward rule preferences. Empty fields match all. */
export class ManualRewardRulePreferenceQuery {
  label: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minLimit: number, statuses: string[], limit: number) {
    this.label = label;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualRewardRulePreference): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualRewardRulePreference[]): ManualRewardRulePreference[] {
    const matched = collections.filter(items, (candidate: ManualRewardRulePreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualRewardRulePreferences(store: ManualRewardRulePreferenceStore, query: ManualRewardRulePreferenceQuery): ManualRewardRulePreference[] {
  return query.apply(store.list());
}
