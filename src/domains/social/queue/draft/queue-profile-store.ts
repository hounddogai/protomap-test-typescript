import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { QueueProfile } from "./queue-profile.js";

/** Keeps queue profiles by code. */
export interface QueueProfileStore {
  find(code: string): QueueProfile | undefined;
  save(item: QueueProfile): void;
  remove(code: string): boolean;
  list(): QueueProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryQueueProfileStore implements QueueProfileStore {
  items: Map<string, QueueProfile>;
  order: string[];

  constructor(items: Map<string, QueueProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): QueueProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: QueueProfile): void {
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

  list(): QueueProfile[] {
    const out: QueueProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryQueueProfileStore(): QueueProfileStore {
  return new MemoryQueueProfileStore(new Map<string, QueueProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedQueueProfileStore implements QueueProfileStore {
  inner: QueueProfileStore;
  cache: cache.TtlCache<QueueProfile>;
  hits: number;
  misses: number;

  constructor(inner: QueueProfileStore, cacheValue: cache.TtlCache<QueueProfile>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): QueueProfile | undefined {
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

  save(item: QueueProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): QueueProfile[] {
    return this.inner.list();
  }
}

export function newCachedQueueProfileStore(inner: QueueProfileStore, ttl: number, clockValue: clock.Clock): QueueProfileStore {
  return new CachedQueueProfileStore(inner, cache.newTtlCache<QueueProfile>(128, ttl, clockValue), 0, 0);
}

/** Selects queue profiles. Empty fields match all. */
export class QueueProfileQuery {
  title: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minScore: number, statuses: string[], limit: number) {
    this.title = title;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: QueueProfile): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: QueueProfile[]): QueueProfile[] {
    const matched = collections.filter(items, (candidate: QueueProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findQueueProfiles(store: QueueProfileStore, query: QueueProfileQuery): QueueProfile[] {
  return query.apply(store.list());
}
