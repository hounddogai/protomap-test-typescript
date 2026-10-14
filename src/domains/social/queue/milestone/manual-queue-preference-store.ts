import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualQueuePreference } from "./manual-queue-preference.js";

/** Keeps manual queue preferences by code. */
export interface ManualQueuePreferenceStore {
  find(code: string): ManualQueuePreference | undefined;
  save(item: ManualQueuePreference): void;
  remove(code: string): boolean;
  list(): ManualQueuePreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualQueuePreferenceStore implements ManualQueuePreferenceStore {
  items: Map<string, ManualQueuePreference>;
  order: string[];

  constructor(items: Map<string, ManualQueuePreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualQueuePreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualQueuePreference): void {
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

  list(): ManualQueuePreference[] {
    const out: ManualQueuePreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualQueuePreferenceStore(): ManualQueuePreferenceStore {
  return new MemoryManualQueuePreferenceStore(new Map<string, ManualQueuePreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualQueuePreferenceStore implements ManualQueuePreferenceStore {
  inner: ManualQueuePreferenceStore;
  cache: cache.TtlCache<ManualQueuePreference>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualQueuePreferenceStore,
    cacheValue: cache.TtlCache<ManualQueuePreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualQueuePreference | undefined {
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

  save(item: ManualQueuePreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualQueuePreference[] {
    return this.inner.list();
  }
}

export function newCachedManualQueuePreferenceStore(inner: ManualQueuePreferenceStore, ttl: number, clockValue: clock.Clock): ManualQueuePreferenceStore {
  return new CachedManualQueuePreferenceStore(
    inner,
    cache.newTtlCache<ManualQueuePreference>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual queue preferences. Empty fields match all. */
export class ManualQueuePreferenceQuery {
  label: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRate: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualQueuePreference): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualQueuePreference[]): ManualQueuePreference[] {
    const matched = collections.filter(items, (candidate: ManualQueuePreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualQueuePreferences(store: ManualQueuePreferenceStore, query: ManualQueuePreferenceQuery): ManualQueuePreference[] {
  return query.apply(store.list());
}
