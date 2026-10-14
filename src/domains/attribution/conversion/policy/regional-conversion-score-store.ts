import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalConversionScore } from "./regional-conversion-score.js";

/** Keeps regional conversion scores by code. */
export interface RegionalConversionScoreStore {
  find(code: string): RegionalConversionScore | undefined;
  save(item: RegionalConversionScore): void;
  remove(code: string): boolean;
  list(): RegionalConversionScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalConversionScoreStore implements RegionalConversionScoreStore {
  items: Map<string, RegionalConversionScore>;
  order: string[];

  constructor(items: Map<string, RegionalConversionScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalConversionScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalConversionScore): void {
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

  list(): RegionalConversionScore[] {
    const out: RegionalConversionScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalConversionScoreStore(): RegionalConversionScoreStore {
  return new MemoryRegionalConversionScoreStore(new Map<string, RegionalConversionScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalConversionScoreStore implements RegionalConversionScoreStore {
  inner: RegionalConversionScoreStore;
  cache: cache.TtlCache<RegionalConversionScore>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalConversionScoreStore,
    cacheValue: cache.TtlCache<RegionalConversionScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalConversionScore | undefined {
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

  save(item: RegionalConversionScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalConversionScore[] {
    return this.inner.list();
  }
}

export function newCachedRegionalConversionScoreStore(inner: RegionalConversionScoreStore, ttl: number, clockValue: clock.Clock): RegionalConversionScoreStore {
  return new CachedRegionalConversionScoreStore(
    inner,
    cache.newTtlCache<RegionalConversionScore>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional conversion scores. Empty fields match all. */
export class RegionalConversionScoreQuery {
  label: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minWindowDays: number, statuses: string[], limit: number) {
    this.label = label;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalConversionScore): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalConversionScore[]): RegionalConversionScore[] {
    const matched = collections.filter(items, (candidate: RegionalConversionScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalConversionScores(store: RegionalConversionScoreStore, query: RegionalConversionScoreQuery): RegionalConversionScore[] {
  return query.apply(store.list());
}
