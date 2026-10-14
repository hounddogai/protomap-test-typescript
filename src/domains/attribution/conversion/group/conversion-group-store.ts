import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ConversionGroup } from "./conversion-group.js";

/** Keeps conversion groups by code. */
export interface ConversionGroupStore {
  find(code: string): ConversionGroup | undefined;
  save(item: ConversionGroup): void;
  remove(code: string): boolean;
  list(): ConversionGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryConversionGroupStore implements ConversionGroupStore {
  items: Map<string, ConversionGroup>;
  order: string[];

  constructor(items: Map<string, ConversionGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ConversionGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ConversionGroup): void {
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

  list(): ConversionGroup[] {
    const out: ConversionGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryConversionGroupStore(): ConversionGroupStore {
  return new MemoryConversionGroupStore(new Map<string, ConversionGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedConversionGroupStore implements ConversionGroupStore {
  inner: ConversionGroupStore;
  cache: cache.TtlCache<ConversionGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: ConversionGroupStore,
    cacheValue: cache.TtlCache<ConversionGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ConversionGroup | undefined {
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

  save(item: ConversionGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ConversionGroup[] {
    return this.inner.list();
  }
}

export function newCachedConversionGroupStore(inner: ConversionGroupStore, ttl: number, clockValue: clock.Clock): ConversionGroupStore {
  return new CachedConversionGroupStore(inner, cache.newTtlCache<ConversionGroup>(256, ttl, clockValue), 0, 0);
}

/** Selects conversion groups. Empty fields match all. */
export class ConversionGroupQuery {
  locale: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ConversionGroup): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ConversionGroup[]): ConversionGroup[] {
    const matched = collections.filter(items, (candidate: ConversionGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findConversionGroups(store: ConversionGroupStore, query: ConversionGroupQuery): ConversionGroup[] {
  return query.apply(store.list());
}
