import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalRewardRulePreference } from "./regional-reward-rule-preference.js";

/** Keeps regional reward rule preferences by code. */
export interface RegionalRewardRulePreferenceStore {
  find(code: string): RegionalRewardRulePreference | undefined;
  save(item: RegionalRewardRulePreference): void;
  remove(code: string): boolean;
  list(): RegionalRewardRulePreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalRewardRulePreferenceStore implements RegionalRewardRulePreferenceStore {
  items: Map<string, RegionalRewardRulePreference>;
  order: string[];

  constructor(items: Map<string, RegionalRewardRulePreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalRewardRulePreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalRewardRulePreference): void {
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

  list(): RegionalRewardRulePreference[] {
    const out: RegionalRewardRulePreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalRewardRulePreferenceStore(): RegionalRewardRulePreferenceStore {
  return new MemoryRegionalRewardRulePreferenceStore(new Map<string, RegionalRewardRulePreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalRewardRulePreferenceStore implements RegionalRewardRulePreferenceStore {
  inner: RegionalRewardRulePreferenceStore;
  cache: cache.TtlCache<RegionalRewardRulePreference>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalRewardRulePreferenceStore,
    cacheValue: cache.TtlCache<RegionalRewardRulePreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalRewardRulePreference | undefined {
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

  save(item: RegionalRewardRulePreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalRewardRulePreference[] {
    return this.inner.list();
  }
}

export function newCachedRegionalRewardRulePreferenceStore(inner: RegionalRewardRulePreferenceStore, ttl: number, clockValue: clock.Clock): RegionalRewardRulePreferenceStore {
  return new CachedRegionalRewardRulePreferenceStore(
    inner,
    cache.newTtlCache<RegionalRewardRulePreference>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional reward rule preferences. Empty fields match all. */
export class RegionalRewardRulePreferenceQuery {
  channel: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRatio: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalRewardRulePreference): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalRewardRulePreference[]): RegionalRewardRulePreference[] {
    const matched = collections.filter(items, (candidate: RegionalRewardRulePreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalRewardRulePreferences(store: RegionalRewardRulePreferenceStore, query: RegionalRewardRulePreferenceQuery): RegionalRewardRulePreference[] {
  return query.apply(store.list());
}
