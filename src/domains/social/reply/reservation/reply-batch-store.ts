import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReplyBatch } from "./reply-batch.js";

/** Keeps reply batches by code. */
export interface ReplyBatchStore {
  find(code: string): ReplyBatch | undefined;
  save(item: ReplyBatch): void;
  remove(code: string): boolean;
  list(): ReplyBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReplyBatchStore implements ReplyBatchStore {
  items: Map<string, ReplyBatch>;
  order: string[];

  constructor(items: Map<string, ReplyBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReplyBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReplyBatch): void {
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

  list(): ReplyBatch[] {
    const out: ReplyBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReplyBatchStore(): ReplyBatchStore {
  return new MemoryReplyBatchStore(new Map<string, ReplyBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReplyBatchStore implements ReplyBatchStore {
  inner: ReplyBatchStore;
  cache: cache.TtlCache<ReplyBatch>;
  hits: number;
  misses: number;

  constructor(inner: ReplyBatchStore, cacheValue: cache.TtlCache<ReplyBatch>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReplyBatch | undefined {
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

  save(item: ReplyBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReplyBatch[] {
    return this.inner.list();
  }
}

export function newCachedReplyBatchStore(inner: ReplyBatchStore, ttl: number, clockValue: clock.Clock): ReplyBatchStore {
  return new CachedReplyBatchStore(inner, cache.newTtlCache<ReplyBatch>(256, ttl, clockValue), 0, 0);
}

/** Selects reply batches. Empty fields match all. */
export class ReplyBatchQuery {
  label: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minSendAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReplyBatch): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReplyBatch[]): ReplyBatch[] {
    const matched = collections.filter(items, (candidate: ReplyBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReplyBatches(store: ReplyBatchStore, query: ReplyBatchQuery): ReplyBatch[] {
  return query.apply(store.list());
}
