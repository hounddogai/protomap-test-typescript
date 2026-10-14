import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientQueueDraft } from "./lenient-queue-draft.js";

/** Keeps lenient queue drafts by code. */
export interface LenientQueueDraftStore {
  find(code: string): LenientQueueDraft | undefined;
  save(item: LenientQueueDraft): void;
  remove(code: string): boolean;
  list(): LenientQueueDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientQueueDraftStore implements LenientQueueDraftStore {
  items: Map<string, LenientQueueDraft>;
  order: string[];

  constructor(items: Map<string, LenientQueueDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientQueueDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientQueueDraft): void {
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

  list(): LenientQueueDraft[] {
    const out: LenientQueueDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientQueueDraftStore(): LenientQueueDraftStore {
  return new MemoryLenientQueueDraftStore(new Map<string, LenientQueueDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientQueueDraftStore implements LenientQueueDraftStore {
  inner: LenientQueueDraftStore;
  cache: cache.TtlCache<LenientQueueDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientQueueDraftStore,
    cacheValue: cache.TtlCache<LenientQueueDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientQueueDraft | undefined {
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

  save(item: LenientQueueDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientQueueDraft[] {
    return this.inner.list();
  }
}

export function newCachedLenientQueueDraftStore(inner: LenientQueueDraftStore, ttl: number, clockValue: clock.Clock): LenientQueueDraftStore {
  return new CachedLenientQueueDraftStore(inner, cache.newTtlCache<LenientQueueDraft>(1024, ttl, clockValue), 0, 0);
}

/** Selects lenient queue drafts. Empty fields match all. */
export class LenientQueueDraftQuery {
  utmSource: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minCapacity: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientQueueDraft): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientQueueDraft[]): LenientQueueDraft[] {
    const matched = collections.filter(items, (candidate: LenientQueueDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientQueueDrafts(store: LenientQueueDraftStore, query: LenientQueueDraftQuery): LenientQueueDraft[] {
  return query.apply(store.list());
}
