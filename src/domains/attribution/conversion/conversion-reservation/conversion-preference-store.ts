import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ConversionPreference } from "./conversion-preference.js";

/** Keeps conversion preferences by code. */
export interface ConversionPreferenceStore {
  find(code: string): ConversionPreference | undefined;
  save(item: ConversionPreference): void;
  remove(code: string): boolean;
  list(): ConversionPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryConversionPreferenceStore implements ConversionPreferenceStore {
  items: Map<string, ConversionPreference>;
  order: string[];

  constructor(items: Map<string, ConversionPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ConversionPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ConversionPreference): void {
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

  list(): ConversionPreference[] {
    const out: ConversionPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryConversionPreferenceStore(): ConversionPreferenceStore {
  return new MemoryConversionPreferenceStore(new Map<string, ConversionPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedConversionPreferenceStore implements ConversionPreferenceStore {
  inner: ConversionPreferenceStore;
  cache: cache.TtlCache<ConversionPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: ConversionPreferenceStore,
    cacheValue: cache.TtlCache<ConversionPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ConversionPreference | undefined {
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

  save(item: ConversionPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ConversionPreference[] {
    return this.inner.list();
  }
}

export function newCachedConversionPreferenceStore(inner: ConversionPreferenceStore, ttl: number, clockValue: clock.Clock): ConversionPreferenceStore {
  return new CachedConversionPreferenceStore(
    inner,
    cache.newTtlCache<ConversionPreference>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects conversion preferences. Empty fields match all. */
export class ConversionPreferenceQuery {
  label: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minThreshold: number, statuses: string[], limit: number) {
    this.label = label;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ConversionPreference): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ConversionPreference[]): ConversionPreference[] {
    const matched = collections.filter(items, (candidate: ConversionPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findConversionPreferences(store: ConversionPreferenceStore, query: ConversionPreferenceQuery): ConversionPreference[] {
  return query.apply(store.list());
}
