import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { QueuePreference } from "./queue-preference.js";

/** Keeps queue preferences by code. */
export interface QueuePreferenceStore {
  find(code: string): QueuePreference | undefined;
  save(item: QueuePreference): void;
  remove(code: string): boolean;
  list(): QueuePreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryQueuePreferenceStore implements QueuePreferenceStore {
  items: Map<string, QueuePreference>;
  order: string[];

  constructor(items: Map<string, QueuePreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): QueuePreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: QueuePreference): void {
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

  list(): QueuePreference[] {
    const out: QueuePreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryQueuePreferenceStore(): QueuePreferenceStore {
  return new MemoryQueuePreferenceStore(new Map<string, QueuePreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedQueuePreferenceStore implements QueuePreferenceStore {
  inner: QueuePreferenceStore;
  cache: cache.TtlCache<QueuePreference>;
  hits: number;
  misses: number;

  constructor(
    inner: QueuePreferenceStore,
    cacheValue: cache.TtlCache<QueuePreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): QueuePreference | undefined {
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

  save(item: QueuePreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): QueuePreference[] {
    return this.inner.list();
  }
}

export function newCachedQueuePreferenceStore(inner: QueuePreferenceStore, ttl: number, clockValue: clock.Clock): QueuePreferenceStore {
  return new CachedQueuePreferenceStore(inner, cache.newTtlCache<QueuePreference>(512, ttl, clockValue), 0, 0);
}

/** Selects queue preferences. Empty fields match all. */
export class QueuePreferenceQuery {
  label: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minStartsAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: QueuePreference): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: QueuePreference[]): QueuePreference[] {
    const matched = collections.filter(items, (candidate: QueuePreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findQueuePreferences(store: QueuePreferenceStore, query: QueuePreferenceQuery): QueuePreference[] {
  return query.apply(store.list());
}
