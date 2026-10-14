import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingExitRulePreference } from "./pending-exit-rule-preference.js";

/** Keeps pending exit rule preferences by code. */
export interface PendingExitRulePreferenceStore {
  find(code: string): PendingExitRulePreference | undefined;
  save(item: PendingExitRulePreference): void;
  remove(code: string): boolean;
  list(): PendingExitRulePreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingExitRulePreferenceStore implements PendingExitRulePreferenceStore {
  items: Map<string, PendingExitRulePreference>;
  order: string[];

  constructor(items: Map<string, PendingExitRulePreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingExitRulePreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingExitRulePreference): void {
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

  list(): PendingExitRulePreference[] {
    const out: PendingExitRulePreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingExitRulePreferenceStore(): PendingExitRulePreferenceStore {
  return new MemoryPendingExitRulePreferenceStore(new Map<string, PendingExitRulePreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingExitRulePreferenceStore implements PendingExitRulePreferenceStore {
  inner: PendingExitRulePreferenceStore;
  cache: cache.TtlCache<PendingExitRulePreference>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingExitRulePreferenceStore,
    cacheValue: cache.TtlCache<PendingExitRulePreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingExitRulePreference | undefined {
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

  save(item: PendingExitRulePreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingExitRulePreference[] {
    return this.inner.list();
  }
}

export function newCachedPendingExitRulePreferenceStore(inner: PendingExitRulePreferenceStore, ttl: number, clockValue: clock.Clock): PendingExitRulePreferenceStore {
  return new CachedPendingExitRulePreferenceStore(
    inner,
    cache.newTtlCache<PendingExitRulePreference>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending exit rule preferences. Empty fields match all. */
export class PendingExitRulePreferenceQuery {
  region: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minMinimum: number, statuses: string[], limit: number) {
    this.region = region;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingExitRulePreference): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingExitRulePreference[]): PendingExitRulePreference[] {
    const matched = collections.filter(items, (candidate: PendingExitRulePreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingExitRulePreferences(store: PendingExitRulePreferenceStore, query: PendingExitRulePreferenceQuery): PendingExitRulePreference[] {
  return query.apply(store.list());
}
