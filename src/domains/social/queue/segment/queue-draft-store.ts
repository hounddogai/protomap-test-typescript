import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { QueueDraft } from "./queue-draft.js";

/** Keeps queue drafts by code. */
export interface QueueDraftStore {
  find(code: string): QueueDraft | undefined;
  save(item: QueueDraft): void;
  remove(code: string): boolean;
  list(): QueueDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryQueueDraftStore implements QueueDraftStore {
  items: Map<string, QueueDraft>;
  order: string[];

  constructor(items: Map<string, QueueDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): QueueDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: QueueDraft): void {
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

  list(): QueueDraft[] {
    const out: QueueDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryQueueDraftStore(): QueueDraftStore {
  return new MemoryQueueDraftStore(new Map<string, QueueDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedQueueDraftStore implements QueueDraftStore {
  inner: QueueDraftStore;
  cache: cache.TtlCache<QueueDraft>;
  hits: number;
  misses: number;

  constructor(inner: QueueDraftStore, cacheValue: cache.TtlCache<QueueDraft>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): QueueDraft | undefined {
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

  save(item: QueueDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): QueueDraft[] {
    return this.inner.list();
  }
}

export function newCachedQueueDraftStore(inner: QueueDraftStore, ttl: number, clockValue: clock.Clock): QueueDraftStore {
  return new CachedQueueDraftStore(inner, cache.newTtlCache<QueueDraft>(128, ttl, clockValue), 0, 0);
}

/** Selects queue drafts. Empty fields match all. */
export class QueueDraftQuery {
  title: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minClicks: number, statuses: string[], limit: number) {
    this.title = title;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: QueueDraft): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: QueueDraft[]): QueueDraft[] {
    const matched = collections.filter(items, (candidate: QueueDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findQueueDrafts(store: QueueDraftStore, query: QueueDraftQuery): QueueDraft[] {
  return query.apply(store.list());
}
