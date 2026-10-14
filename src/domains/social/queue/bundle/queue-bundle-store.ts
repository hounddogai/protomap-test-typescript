import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { QueueBundle } from "./queue-bundle.js";

/** Keeps queue bundles by code. */
export interface QueueBundleStore {
  find(code: string): QueueBundle | undefined;
  save(item: QueueBundle): void;
  remove(code: string): boolean;
  list(): QueueBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryQueueBundleStore implements QueueBundleStore {
  items: Map<string, QueueBundle>;
  order: string[];

  constructor(items: Map<string, QueueBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): QueueBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: QueueBundle): void {
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

  list(): QueueBundle[] {
    const out: QueueBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryQueueBundleStore(): QueueBundleStore {
  return new MemoryQueueBundleStore(new Map<string, QueueBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedQueueBundleStore implements QueueBundleStore {
  inner: QueueBundleStore;
  cache: cache.TtlCache<QueueBundle>;
  hits: number;
  misses: number;

  constructor(inner: QueueBundleStore, cacheValue: cache.TtlCache<QueueBundle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): QueueBundle | undefined {
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

  save(item: QueueBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): QueueBundle[] {
    return this.inner.list();
  }
}

export function newCachedQueueBundleStore(inner: QueueBundleStore, ttl: number, clockValue: clock.Clock): QueueBundleStore {
  return new CachedQueueBundleStore(inner, cache.newTtlCache<QueueBundle>(64, ttl, clockValue), 0, 0);
}

/** Selects queue bundles. Empty fields match all. */
export class QueueBundleQuery {
  utmSource: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minVersion: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: QueueBundle): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: QueueBundle[]): QueueBundle[] {
    const matched = collections.filter(items, (candidate: QueueBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findQueueBundles(store: QueueBundleStore, query: QueueBundleQuery): QueueBundle[] {
  return query.apply(store.list());
}
