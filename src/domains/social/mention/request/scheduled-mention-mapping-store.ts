import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledMentionMapping } from "./scheduled-mention-mapping.js";

/** Keeps scheduled mention mappings by code. */
export interface ScheduledMentionMappingStore {
  find(code: string): ScheduledMentionMapping | undefined;
  save(item: ScheduledMentionMapping): void;
  remove(code: string): boolean;
  list(): ScheduledMentionMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledMentionMappingStore implements ScheduledMentionMappingStore {
  items: Map<string, ScheduledMentionMapping>;
  order: string[];

  constructor(items: Map<string, ScheduledMentionMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledMentionMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledMentionMapping): void {
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

  list(): ScheduledMentionMapping[] {
    const out: ScheduledMentionMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledMentionMappingStore(): ScheduledMentionMappingStore {
  return new MemoryScheduledMentionMappingStore(new Map<string, ScheduledMentionMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledMentionMappingStore implements ScheduledMentionMappingStore {
  inner: ScheduledMentionMappingStore;
  cache: cache.TtlCache<ScheduledMentionMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledMentionMappingStore,
    cacheValue: cache.TtlCache<ScheduledMentionMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledMentionMapping | undefined {
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

  save(item: ScheduledMentionMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledMentionMapping[] {
    return this.inner.list();
  }
}

export function newCachedScheduledMentionMappingStore(inner: ScheduledMentionMappingStore, ttl: number, clockValue: clock.Clock): ScheduledMentionMappingStore {
  return new CachedScheduledMentionMappingStore(
    inner,
    cache.newTtlCache<ScheduledMentionMapping>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled mention mappings. Empty fields match all. */
export class ScheduledMentionMappingQuery {
  source: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minRatio: number, statuses: string[], limit: number) {
    this.source = source;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledMentionMapping): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledMentionMapping[]): ScheduledMentionMapping[] {
    const matched = collections.filter(items, (candidate: ScheduledMentionMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledMentionMappings(store: ScheduledMentionMappingStore, query: ScheduledMentionMappingQuery): ScheduledMentionMapping[] {
  return query.apply(store.list());
}
