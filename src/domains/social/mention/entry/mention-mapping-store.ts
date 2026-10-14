import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MentionMapping } from "./mention-mapping.js";

/** Keeps mention mappings by code. */
export interface MentionMappingStore {
  find(code: string): MentionMapping | undefined;
  save(item: MentionMapping): void;
  remove(code: string): boolean;
  list(): MentionMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMentionMappingStore implements MentionMappingStore {
  items: Map<string, MentionMapping>;
  order: string[];

  constructor(items: Map<string, MentionMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MentionMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MentionMapping): void {
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

  list(): MentionMapping[] {
    const out: MentionMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMentionMappingStore(): MentionMappingStore {
  return new MemoryMentionMappingStore(new Map<string, MentionMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMentionMappingStore implements MentionMappingStore {
  inner: MentionMappingStore;
  cache: cache.TtlCache<MentionMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: MentionMappingStore,
    cacheValue: cache.TtlCache<MentionMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MentionMapping | undefined {
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

  save(item: MentionMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MentionMapping[] {
    return this.inner.list();
  }
}

export function newCachedMentionMappingStore(inner: MentionMappingStore, ttl: number, clockValue: clock.Clock): MentionMappingStore {
  return new CachedMentionMappingStore(inner, cache.newTtlCache<MentionMapping>(64, ttl, clockValue), 0, 0);
}

/** Selects mention mappings. Empty fields match all. */
export class MentionMappingQuery {
  utmSource: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MentionMapping): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MentionMapping[]): MentionMapping[] {
    const matched = collections.filter(items, (candidate: MentionMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMentionMappings(store: MentionMappingStore, query: MentionMappingQuery): MentionMapping[] {
  return query.apply(store.list());
}
