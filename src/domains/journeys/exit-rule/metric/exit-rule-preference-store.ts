import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ExitRulePreference } from "./exit-rule-preference.js";

/** Keeps exit rule preferences by code. */
export interface ExitRulePreferenceStore {
  find(code: string): ExitRulePreference | undefined;
  save(item: ExitRulePreference): void;
  remove(code: string): boolean;
  list(): ExitRulePreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryExitRulePreferenceStore implements ExitRulePreferenceStore {
  items: Map<string, ExitRulePreference>;
  order: string[];

  constructor(items: Map<string, ExitRulePreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ExitRulePreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ExitRulePreference): void {
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

  list(): ExitRulePreference[] {
    const out: ExitRulePreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryExitRulePreferenceStore(): ExitRulePreferenceStore {
  return new MemoryExitRulePreferenceStore(new Map<string, ExitRulePreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedExitRulePreferenceStore implements ExitRulePreferenceStore {
  inner: ExitRulePreferenceStore;
  cache: cache.TtlCache<ExitRulePreference>;
  hits: number;
  misses: number;

  constructor(
    inner: ExitRulePreferenceStore,
    cacheValue: cache.TtlCache<ExitRulePreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ExitRulePreference | undefined {
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

  save(item: ExitRulePreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ExitRulePreference[] {
    return this.inner.list();
  }
}

export function newCachedExitRulePreferenceStore(inner: ExitRulePreferenceStore, ttl: number, clockValue: clock.Clock): ExitRulePreferenceStore {
  return new CachedExitRulePreferenceStore(inner, cache.newTtlCache<ExitRulePreference>(256, ttl, clockValue), 0, 0);
}

/** Selects exit rule preferences. Empty fields match all. */
export class ExitRulePreferenceQuery {
  utmSource: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minRate: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ExitRulePreference): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ExitRulePreference[]): ExitRulePreference[] {
    const matched = collections.filter(items, (candidate: ExitRulePreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findExitRulePreferences(store: ExitRulePreferenceStore, query: ExitRulePreferenceQuery): ExitRulePreference[] {
  return query.apply(store.list());
}
