import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryConversionTarget } from "./primary-conversion-target.js";

/** Keeps primary conversion targets by code. */
export interface PrimaryConversionTargetStore {
  find(code: string): PrimaryConversionTarget | undefined;
  save(item: PrimaryConversionTarget): void;
  remove(code: string): boolean;
  list(): PrimaryConversionTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryConversionTargetStore implements PrimaryConversionTargetStore {
  items: Map<string, PrimaryConversionTarget>;
  order: string[];

  constructor(items: Map<string, PrimaryConversionTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryConversionTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryConversionTarget): void {
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

  list(): PrimaryConversionTarget[] {
    const out: PrimaryConversionTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryConversionTargetStore(): PrimaryConversionTargetStore {
  return new MemoryPrimaryConversionTargetStore(new Map<string, PrimaryConversionTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryConversionTargetStore implements PrimaryConversionTargetStore {
  inner: PrimaryConversionTargetStore;
  cache: cache.TtlCache<PrimaryConversionTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryConversionTargetStore,
    cacheValue: cache.TtlCache<PrimaryConversionTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryConversionTarget | undefined {
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

  save(item: PrimaryConversionTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryConversionTarget[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryConversionTargetStore(inner: PrimaryConversionTargetStore, ttl: number, clockValue: clock.Clock): PrimaryConversionTargetStore {
  return new CachedPrimaryConversionTargetStore(
    inner,
    cache.newTtlCache<PrimaryConversionTarget>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary conversion targets. Empty fields match all. */
export class PrimaryConversionTargetQuery {
  title: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minImpressions: number, statuses: string[], limit: number) {
    this.title = title;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryConversionTarget): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryConversionTarget[]): PrimaryConversionTarget[] {
    const matched = collections.filter(items, (candidate: PrimaryConversionTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryConversionTargets(store: PrimaryConversionTargetStore, query: PrimaryConversionTargetQuery): PrimaryConversionTarget[] {
  return query.apply(store.list());
}
