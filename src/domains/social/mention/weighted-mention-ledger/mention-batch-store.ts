import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MentionBatch } from "./mention-batch.js";

/** Keeps mention batches by code. */
export interface MentionBatchStore {
  find(code: string): MentionBatch | undefined;
  save(item: MentionBatch): void;
  remove(code: string): boolean;
  list(): MentionBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMentionBatchStore implements MentionBatchStore {
  items: Map<string, MentionBatch>;
  order: string[];

  constructor(items: Map<string, MentionBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MentionBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MentionBatch): void {
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

  list(): MentionBatch[] {
    const out: MentionBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMentionBatchStore(): MentionBatchStore {
  return new MemoryMentionBatchStore(new Map<string, MentionBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMentionBatchStore implements MentionBatchStore {
  inner: MentionBatchStore;
  cache: cache.TtlCache<MentionBatch>;
  hits: number;
  misses: number;

  constructor(inner: MentionBatchStore, cacheValue: cache.TtlCache<MentionBatch>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MentionBatch | undefined {
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

  save(item: MentionBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MentionBatch[] {
    return this.inner.list();
  }
}

export function newCachedMentionBatchStore(inner: MentionBatchStore, ttl: number, clockValue: clock.Clock): MentionBatchStore {
  return new CachedMentionBatchStore(inner, cache.newTtlCache<MentionBatch>(64, ttl, clockValue), 0, 0);
}

/** Selects mention batches. Empty fields match all. */
export class MentionBatchQuery {
  name: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minStartsAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MentionBatch): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MentionBatch[]): MentionBatch[] {
    const matched = collections.filter(items, (candidate: MentionBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMentionBatches(store: MentionBatchStore, query: MentionBatchQuery): MentionBatch[] {
  return query.apply(store.list());
}
