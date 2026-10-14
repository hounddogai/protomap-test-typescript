import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReplyThreshold } from "./reply-threshold.js";

/** Keeps reply thresholds by code. */
export interface ReplyThresholdStore {
  find(code: string): ReplyThreshold | undefined;
  save(item: ReplyThreshold): void;
  remove(code: string): boolean;
  list(): ReplyThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReplyThresholdStore implements ReplyThresholdStore {
  items: Map<string, ReplyThreshold>;
  order: string[];

  constructor(items: Map<string, ReplyThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReplyThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReplyThreshold): void {
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

  list(): ReplyThreshold[] {
    const out: ReplyThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReplyThresholdStore(): ReplyThresholdStore {
  return new MemoryReplyThresholdStore(new Map<string, ReplyThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReplyThresholdStore implements ReplyThresholdStore {
  inner: ReplyThresholdStore;
  cache: cache.TtlCache<ReplyThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: ReplyThresholdStore,
    cacheValue: cache.TtlCache<ReplyThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReplyThreshold | undefined {
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

  save(item: ReplyThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReplyThreshold[] {
    return this.inner.list();
  }
}

export function newCachedReplyThresholdStore(inner: ReplyThresholdStore, ttl: number, clockValue: clock.Clock): ReplyThresholdStore {
  return new CachedReplyThresholdStore(inner, cache.newTtlCache<ReplyThreshold>(1024, ttl, clockValue), 0, 0);
}

/** Selects reply thresholds. Empty fields match all. */
export class ReplyThresholdQuery {
  utmSource: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minRetries: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReplyThreshold): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReplyThreshold[]): ReplyThreshold[] {
    const matched = collections.filter(items, (candidate: ReplyThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReplyThresholds(store: ReplyThresholdStore, query: ReplyThresholdQuery): ReplyThreshold[] {
  return query.apply(store.list());
}
