import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BadgeMapping } from "./badge-mapping.js";

/** Keeps badge mappings by code. */
export interface BadgeMappingStore {
  find(code: string): BadgeMapping | undefined;
  save(item: BadgeMapping): void;
  remove(code: string): boolean;
  list(): BadgeMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBadgeMappingStore implements BadgeMappingStore {
  items: Map<string, BadgeMapping>;
  order: string[];

  constructor(items: Map<string, BadgeMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BadgeMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BadgeMapping): void {
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

  list(): BadgeMapping[] {
    const out: BadgeMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBadgeMappingStore(): BadgeMappingStore {
  return new MemoryBadgeMappingStore(new Map<string, BadgeMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBadgeMappingStore implements BadgeMappingStore {
  inner: BadgeMappingStore;
  cache: cache.TtlCache<BadgeMapping>;
  hits: number;
  misses: number;

  constructor(inner: BadgeMappingStore, cacheValue: cache.TtlCache<BadgeMapping>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BadgeMapping | undefined {
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

  save(item: BadgeMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BadgeMapping[] {
    return this.inner.list();
  }
}

export function newCachedBadgeMappingStore(inner: BadgeMappingStore, ttl: number, clockValue: clock.Clock): BadgeMappingStore {
  return new CachedBadgeMappingStore(inner, cache.newTtlCache<BadgeMapping>(512, ttl, clockValue), 0, 0);
}

/** Selects badge mappings. Empty fields match all. */
export class BadgeMappingQuery {
  channel: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRetries: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BadgeMapping): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BadgeMapping[]): BadgeMapping[] {
    const matched = collections.filter(items, (candidate: BadgeMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBadgeMappings(store: BadgeMappingStore, query: BadgeMappingQuery): BadgeMapping[] {
  return query.apply(store.list());
}
