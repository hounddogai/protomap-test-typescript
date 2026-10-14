import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreditPreference } from "./credit-preference.js";

/** Keeps credit preferences by code. */
export interface CreditPreferenceStore {
  find(code: string): CreditPreference | undefined;
  save(item: CreditPreference): void;
  remove(code: string): boolean;
  list(): CreditPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreditPreferenceStore implements CreditPreferenceStore {
  items: Map<string, CreditPreference>;
  order: string[];

  constructor(items: Map<string, CreditPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreditPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreditPreference): void {
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

  list(): CreditPreference[] {
    const out: CreditPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreditPreferenceStore(): CreditPreferenceStore {
  return new MemoryCreditPreferenceStore(new Map<string, CreditPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreditPreferenceStore implements CreditPreferenceStore {
  inner: CreditPreferenceStore;
  cache: cache.TtlCache<CreditPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: CreditPreferenceStore,
    cacheValue: cache.TtlCache<CreditPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreditPreference | undefined {
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

  save(item: CreditPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreditPreference[] {
    return this.inner.list();
  }
}

export function newCachedCreditPreferenceStore(inner: CreditPreferenceStore, ttl: number, clockValue: clock.Clock): CreditPreferenceStore {
  return new CachedCreditPreferenceStore(inner, cache.newTtlCache<CreditPreference>(256, ttl, clockValue), 0, 0);
}

/** Selects credit preferences. Empty fields match all. */
export class CreditPreferenceQuery {
  source: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minPriority: number, statuses: string[], limit: number) {
    this.source = source;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreditPreference): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreditPreference[]): CreditPreference[] {
    const matched = collections.filter(items, (candidate: CreditPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreditPreferences(store: CreditPreferenceStore, query: CreditPreferenceQuery): CreditPreference[] {
  return query.apply(store.list());
}
