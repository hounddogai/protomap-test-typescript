import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryConversionGroup } from "./primary-conversion-group.js";

/** Keeps primary conversion groups by code. */
export interface PrimaryConversionGroupStore {
  find(code: string): PrimaryConversionGroup | undefined;
  save(item: PrimaryConversionGroup): void;
  remove(code: string): boolean;
  list(): PrimaryConversionGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryConversionGroupStore implements PrimaryConversionGroupStore {
  items: Map<string, PrimaryConversionGroup>;
  order: string[];

  constructor(items: Map<string, PrimaryConversionGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryConversionGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryConversionGroup): void {
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

  list(): PrimaryConversionGroup[] {
    const out: PrimaryConversionGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryConversionGroupStore(): PrimaryConversionGroupStore {
  return new MemoryPrimaryConversionGroupStore(new Map<string, PrimaryConversionGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryConversionGroupStore implements PrimaryConversionGroupStore {
  inner: PrimaryConversionGroupStore;
  cache: cache.TtlCache<PrimaryConversionGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryConversionGroupStore,
    cacheValue: cache.TtlCache<PrimaryConversionGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryConversionGroup | undefined {
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

  save(item: PrimaryConversionGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryConversionGroup[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryConversionGroupStore(inner: PrimaryConversionGroupStore, ttl: number, clockValue: clock.Clock): PrimaryConversionGroupStore {
  return new CachedPrimaryConversionGroupStore(
    inner,
    cache.newTtlCache<PrimaryConversionGroup>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary conversion groups. Empty fields match all. */
export class PrimaryConversionGroupQuery {
  utmSource: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minScore: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryConversionGroup): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryConversionGroup[]): PrimaryConversionGroup[] {
    const matched = collections.filter(items, (candidate: PrimaryConversionGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryConversionGroups(store: PrimaryConversionGroupStore, query: PrimaryConversionGroupQuery): PrimaryConversionGroup[] {
  return query.apply(store.list());
}
