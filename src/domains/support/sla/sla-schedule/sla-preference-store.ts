import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SlaPreference } from "./sla-preference.js";

/** Keeps sla preferences by code. */
export interface SlaPreferenceStore {
  find(code: string): SlaPreference | undefined;
  save(item: SlaPreference): void;
  remove(code: string): boolean;
  list(): SlaPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySlaPreferenceStore implements SlaPreferenceStore {
  items: Map<string, SlaPreference>;
  order: string[];

  constructor(items: Map<string, SlaPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SlaPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SlaPreference): void {
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

  list(): SlaPreference[] {
    const out: SlaPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySlaPreferenceStore(): SlaPreferenceStore {
  return new MemorySlaPreferenceStore(new Map<string, SlaPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSlaPreferenceStore implements SlaPreferenceStore {
  inner: SlaPreferenceStore;
  cache: cache.TtlCache<SlaPreference>;
  hits: number;
  misses: number;

  constructor(inner: SlaPreferenceStore, cacheValue: cache.TtlCache<SlaPreference>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SlaPreference | undefined {
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

  save(item: SlaPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SlaPreference[] {
    return this.inner.list();
  }
}

export function newCachedSlaPreferenceStore(inner: SlaPreferenceStore, ttl: number, clockValue: clock.Clock): SlaPreferenceStore {
  return new CachedSlaPreferenceStore(inner, cache.newTtlCache<SlaPreference>(1024, ttl, clockValue), 0, 0);
}

/** Selects sla preferences. Empty fields match all. */
export class SlaPreferenceQuery {
  country: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minImpressions: number, statuses: string[], limit: number) {
    this.country = country;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SlaPreference): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SlaPreference[]): SlaPreference[] {
    const matched = collections.filter(items, (candidate: SlaPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSlaPreferences(store: SlaPreferenceStore, query: SlaPreferenceQuery): SlaPreference[] {
  return query.apply(store.list());
}
