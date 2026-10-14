import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReplyRequest } from "./reply-request.js";

/** Keeps reply requests by code. */
export interface ReplyRequestStore {
  find(code: string): ReplyRequest | undefined;
  save(item: ReplyRequest): void;
  remove(code: string): boolean;
  list(): ReplyRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReplyRequestStore implements ReplyRequestStore {
  items: Map<string, ReplyRequest>;
  order: string[];

  constructor(items: Map<string, ReplyRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReplyRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReplyRequest): void {
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

  list(): ReplyRequest[] {
    const out: ReplyRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReplyRequestStore(): ReplyRequestStore {
  return new MemoryReplyRequestStore(new Map<string, ReplyRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReplyRequestStore implements ReplyRequestStore {
  inner: ReplyRequestStore;
  cache: cache.TtlCache<ReplyRequest>;
  hits: number;
  misses: number;

  constructor(inner: ReplyRequestStore, cacheValue: cache.TtlCache<ReplyRequest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReplyRequest | undefined {
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

  save(item: ReplyRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReplyRequest[] {
    return this.inner.list();
  }
}

export function newCachedReplyRequestStore(inner: ReplyRequestStore, ttl: number, clockValue: clock.Clock): ReplyRequestStore {
  return new CachedReplyRequestStore(inner, cache.newTtlCache<ReplyRequest>(128, ttl, clockValue), 0, 0);
}

/** Selects reply requests. Empty fields match all. */
export class ReplyRequestQuery {
  title: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRate: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReplyRequest): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReplyRequest[]): ReplyRequest[] {
    const matched = collections.filter(items, (candidate: ReplyRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReplyRequests(store: ReplyRequestStore, query: ReplyRequestQuery): ReplyRequest[] {
  return query.apply(store.list());
}
