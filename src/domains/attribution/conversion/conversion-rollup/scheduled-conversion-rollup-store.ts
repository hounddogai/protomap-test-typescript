import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledConversionRollup } from "./scheduled-conversion-rollup.js";

/** Keeps scheduled conversion rollups by code. */
export interface ScheduledConversionRollupStore {
  find(code: string): ScheduledConversionRollup | undefined;
  save(item: ScheduledConversionRollup): void;
  remove(code: string): boolean;
  list(): ScheduledConversionRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledConversionRollupStore implements ScheduledConversionRollupStore {
  items: Map<string, ScheduledConversionRollup>;
  order: string[];

  constructor(items: Map<string, ScheduledConversionRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledConversionRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledConversionRollup): void {
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

  list(): ScheduledConversionRollup[] {
    const out: ScheduledConversionRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledConversionRollupStore(): ScheduledConversionRollupStore {
  return new MemoryScheduledConversionRollupStore(new Map<string, ScheduledConversionRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledConversionRollupStore implements ScheduledConversionRollupStore {
  inner: ScheduledConversionRollupStore;
  cache: cache.TtlCache<ScheduledConversionRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledConversionRollupStore,
    cacheValue: cache.TtlCache<ScheduledConversionRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledConversionRollup | undefined {
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

  save(item: ScheduledConversionRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledConversionRollup[] {
    return this.inner.list();
  }
}

export function newCachedScheduledConversionRollupStore(inner: ScheduledConversionRollupStore, ttl: number, clockValue: clock.Clock): ScheduledConversionRollupStore {
  return new CachedScheduledConversionRollupStore(
    inner,
    cache.newTtlCache<ScheduledConversionRollup>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled conversion rollups. Empty fields match all. */
export class ScheduledConversionRollupQuery {
  utmSource: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minRevision: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledConversionRollup): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledConversionRollup[]): ScheduledConversionRollup[] {
    const matched = collections.filter(items, (candidate: ScheduledConversionRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledConversionRollups(store: ScheduledConversionRollupStore, query: ScheduledConversionRollupQuery): ScheduledConversionRollup[] {
  return query.apply(store.list());
}
