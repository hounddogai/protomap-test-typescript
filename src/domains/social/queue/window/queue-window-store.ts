import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { QueueWindow } from "./queue-window.js";

/** Keeps queue windows by code. */
export interface QueueWindowStore {
  find(code: string): QueueWindow | undefined;
  save(item: QueueWindow): void;
  remove(code: string): boolean;
  list(): QueueWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryQueueWindowStore implements QueueWindowStore {
  items: Map<string, QueueWindow>;
  order: string[];

  constructor(items: Map<string, QueueWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): QueueWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: QueueWindow): void {
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

  list(): QueueWindow[] {
    const out: QueueWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryQueueWindowStore(): QueueWindowStore {
  return new MemoryQueueWindowStore(new Map<string, QueueWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedQueueWindowStore implements QueueWindowStore {
  inner: QueueWindowStore;
  cache: cache.TtlCache<QueueWindow>;
  hits: number;
  misses: number;

  constructor(inner: QueueWindowStore, cacheValue: cache.TtlCache<QueueWindow>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): QueueWindow | undefined {
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

  save(item: QueueWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): QueueWindow[] {
    return this.inner.list();
  }
}

export function newCachedQueueWindowStore(inner: QueueWindowStore, ttl: number, clockValue: clock.Clock): QueueWindowStore {
  return new CachedQueueWindowStore(inner, cache.newTtlCache<QueueWindow>(512, ttl, clockValue), 0, 0);
}

/** Selects queue windows. Empty fields match all. */
export class QueueWindowQuery {
  utmSource: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minAttempts: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: QueueWindow): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: QueueWindow[]): QueueWindow[] {
    const matched = collections.filter(items, (candidate: QueueWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findQueueWindows(store: QueueWindowStore, query: QueueWindowQuery): QueueWindow[] {
  return query.apply(store.list());
}
