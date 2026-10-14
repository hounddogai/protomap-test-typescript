import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledReplyException } from "./scheduled-reply-exception.js";

/** Keeps scheduled reply exceptions by code. */
export interface ScheduledReplyExceptionStore {
  find(code: string): ScheduledReplyException | undefined;
  save(item: ScheduledReplyException): void;
  remove(code: string): boolean;
  list(): ScheduledReplyException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledReplyExceptionStore implements ScheduledReplyExceptionStore {
  items: Map<string, ScheduledReplyException>;
  order: string[];

  constructor(items: Map<string, ScheduledReplyException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledReplyException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledReplyException): void {
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

  list(): ScheduledReplyException[] {
    const out: ScheduledReplyException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledReplyExceptionStore(): ScheduledReplyExceptionStore {
  return new MemoryScheduledReplyExceptionStore(new Map<string, ScheduledReplyException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledReplyExceptionStore implements ScheduledReplyExceptionStore {
  inner: ScheduledReplyExceptionStore;
  cache: cache.TtlCache<ScheduledReplyException>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledReplyExceptionStore,
    cacheValue: cache.TtlCache<ScheduledReplyException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledReplyException | undefined {
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

  save(item: ScheduledReplyException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledReplyException[] {
    return this.inner.list();
  }
}

export function newCachedScheduledReplyExceptionStore(inner: ScheduledReplyExceptionStore, ttl: number, clockValue: clock.Clock): ScheduledReplyExceptionStore {
  return new CachedScheduledReplyExceptionStore(
    inner,
    cache.newTtlCache<ScheduledReplyException>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled reply exceptions. Empty fields match all. */
export class ScheduledReplyExceptionQuery {
  name: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledReplyException): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledReplyException[]): ScheduledReplyException[] {
    const matched = collections.filter(items, (candidate: ScheduledReplyException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledReplyExceptions(store: ScheduledReplyExceptionStore, query: ScheduledReplyExceptionQuery): ScheduledReplyException[] {
  return query.apply(store.list());
}
