import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingBidRulePreference } from "./rolling-bid-rule-preference.js";

/** Keeps rolling bid rule preferences by code. */
export interface RollingBidRulePreferenceStore {
  find(code: string): RollingBidRulePreference | undefined;
  save(item: RollingBidRulePreference): void;
  remove(code: string): boolean;
  list(): RollingBidRulePreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingBidRulePreferenceStore implements RollingBidRulePreferenceStore {
  items: Map<string, RollingBidRulePreference>;
  order: string[];

  constructor(items: Map<string, RollingBidRulePreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingBidRulePreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingBidRulePreference): void {
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

  list(): RollingBidRulePreference[] {
    const out: RollingBidRulePreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingBidRulePreferenceStore(): RollingBidRulePreferenceStore {
  return new MemoryRollingBidRulePreferenceStore(new Map<string, RollingBidRulePreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingBidRulePreferenceStore implements RollingBidRulePreferenceStore {
  inner: RollingBidRulePreferenceStore;
  cache: cache.TtlCache<RollingBidRulePreference>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingBidRulePreferenceStore,
    cacheValue: cache.TtlCache<RollingBidRulePreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingBidRulePreference | undefined {
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

  save(item: RollingBidRulePreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingBidRulePreference[] {
    return this.inner.list();
  }
}

export function newCachedRollingBidRulePreferenceStore(inner: RollingBidRulePreferenceStore, ttl: number, clockValue: clock.Clock): RollingBidRulePreferenceStore {
  return new CachedRollingBidRulePreferenceStore(
    inner,
    cache.newTtlCache<RollingBidRulePreference>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling bid rule preferences. Empty fields match all. */
export class RollingBidRulePreferenceQuery {
  title: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMaximum: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingBidRulePreference): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingBidRulePreference[]): RollingBidRulePreference[] {
    const matched = collections.filter(items, (candidate: RollingBidRulePreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingBidRulePreferences(store: RollingBidRulePreferenceStore, query: RollingBidRulePreferenceQuery): RollingBidRulePreference[] {
  return query.apply(store.list());
}
