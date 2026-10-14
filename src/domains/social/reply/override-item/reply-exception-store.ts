import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReplyException } from "./reply-exception.js";

/** Keeps reply exceptions by code. */
export interface ReplyExceptionStore {
  find(code: string): ReplyException | undefined;
  save(item: ReplyException): void;
  remove(code: string): boolean;
  list(): ReplyException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReplyExceptionStore implements ReplyExceptionStore {
  items: Map<string, ReplyException>;
  order: string[];

  constructor(items: Map<string, ReplyException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReplyException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReplyException): void {
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

  list(): ReplyException[] {
    const out: ReplyException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReplyExceptionStore(): ReplyExceptionStore {
  return new MemoryReplyExceptionStore(new Map<string, ReplyException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReplyExceptionStore implements ReplyExceptionStore {
  inner: ReplyExceptionStore;
  cache: cache.TtlCache<ReplyException>;
  hits: number;
  misses: number;

  constructor(
    inner: ReplyExceptionStore,
    cacheValue: cache.TtlCache<ReplyException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReplyException | undefined {
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

  save(item: ReplyException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReplyException[] {
    return this.inner.list();
  }
}

export function newCachedReplyExceptionStore(inner: ReplyExceptionStore, ttl: number, clockValue: clock.Clock): ReplyExceptionStore {
  return new CachedReplyExceptionStore(inner, cache.newTtlCache<ReplyException>(1024, ttl, clockValue), 0, 0);
}

/** Selects reply exceptions. Empty fields match all. */
export class ReplyExceptionQuery {
  category: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.category = category;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReplyException): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReplyException[]): ReplyException[] {
    const matched = collections.filter(items, (candidate: ReplyException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReplyExceptions(store: ReplyExceptionStore, query: ReplyExceptionQuery): ReplyException[] {
  return query.apply(store.list());
}
