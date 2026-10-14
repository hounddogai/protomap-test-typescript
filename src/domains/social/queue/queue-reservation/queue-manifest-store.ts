import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { QueueManifest } from "./queue-manifest.js";

/** Keeps queue manifests by code. */
export interface QueueManifestStore {
  find(code: string): QueueManifest | undefined;
  save(item: QueueManifest): void;
  remove(code: string): boolean;
  list(): QueueManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryQueueManifestStore implements QueueManifestStore {
  items: Map<string, QueueManifest>;
  order: string[];

  constructor(items: Map<string, QueueManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): QueueManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: QueueManifest): void {
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

  list(): QueueManifest[] {
    const out: QueueManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryQueueManifestStore(): QueueManifestStore {
  return new MemoryQueueManifestStore(new Map<string, QueueManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedQueueManifestStore implements QueueManifestStore {
  inner: QueueManifestStore;
  cache: cache.TtlCache<QueueManifest>;
  hits: number;
  misses: number;

  constructor(inner: QueueManifestStore, cacheValue: cache.TtlCache<QueueManifest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): QueueManifest | undefined {
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

  save(item: QueueManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): QueueManifest[] {
    return this.inner.list();
  }
}

export function newCachedQueueManifestStore(inner: QueueManifestStore, ttl: number, clockValue: clock.Clock): QueueManifestStore {
  return new CachedQueueManifestStore(inner, cache.newTtlCache<QueueManifest>(1024, ttl, clockValue), 0, 0);
}

/** Selects queue manifests. Empty fields match all. */
export class QueueManifestQuery {
  locale: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minQuantity: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: QueueManifest): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: QueueManifest[]): QueueManifest[] {
    const matched = collections.filter(items, (candidate: QueueManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findQueueManifests(store: QueueManifestStore, query: QueueManifestQuery): QueueManifest[] {
  return query.apply(store.list());
}
