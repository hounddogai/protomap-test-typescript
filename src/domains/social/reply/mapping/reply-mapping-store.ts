import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReplyMapping } from "./reply-mapping.js";

/** Keeps reply mappings by code. */
export interface ReplyMappingStore {
  find(code: string): ReplyMapping | undefined;
  save(item: ReplyMapping): void;
  remove(code: string): boolean;
  list(): ReplyMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReplyMappingStore implements ReplyMappingStore {
  items: Map<string, ReplyMapping>;
  order: string[];

  constructor(items: Map<string, ReplyMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReplyMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReplyMapping): void {
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

  list(): ReplyMapping[] {
    const out: ReplyMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReplyMappingStore(): ReplyMappingStore {
  return new MemoryReplyMappingStore(new Map<string, ReplyMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReplyMappingStore implements ReplyMappingStore {
  inner: ReplyMappingStore;
  cache: cache.TtlCache<ReplyMapping>;
  hits: number;
  misses: number;

  constructor(inner: ReplyMappingStore, cacheValue: cache.TtlCache<ReplyMapping>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReplyMapping | undefined {
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

  save(item: ReplyMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReplyMapping[] {
    return this.inner.list();
  }
}

export function newCachedReplyMappingStore(inner: ReplyMappingStore, ttl: number, clockValue: clock.Clock): ReplyMappingStore {
  return new CachedReplyMappingStore(inner, cache.newTtlCache<ReplyMapping>(1024, ttl, clockValue), 0, 0);
}

/** Selects reply mappings. Empty fields match all. */
export class ReplyMappingQuery {
  label: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minOpenRate: number, statuses: string[], limit: number) {
    this.label = label;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReplyMapping): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReplyMapping[]): ReplyMapping[] {
    const matched = collections.filter(items, (candidate: ReplyMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReplyMappings(store: ReplyMappingStore, query: ReplyMappingQuery): ReplyMapping[] {
  return query.apply(store.list());
}
