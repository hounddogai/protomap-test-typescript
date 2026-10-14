import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalCreativeScore } from "./regional-creative-score.js";

/** Keeps regional creative scores by code. */
export interface RegionalCreativeScoreStore {
  find(code: string): RegionalCreativeScore | undefined;
  save(item: RegionalCreativeScore): void;
  remove(code: string): boolean;
  list(): RegionalCreativeScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalCreativeScoreStore implements RegionalCreativeScoreStore {
  items: Map<string, RegionalCreativeScore>;
  order: string[];

  constructor(items: Map<string, RegionalCreativeScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalCreativeScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalCreativeScore): void {
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

  list(): RegionalCreativeScore[] {
    const out: RegionalCreativeScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalCreativeScoreStore(): RegionalCreativeScoreStore {
  return new MemoryRegionalCreativeScoreStore(new Map<string, RegionalCreativeScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalCreativeScoreStore implements RegionalCreativeScoreStore {
  inner: RegionalCreativeScoreStore;
  cache: cache.TtlCache<RegionalCreativeScore>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalCreativeScoreStore,
    cacheValue: cache.TtlCache<RegionalCreativeScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalCreativeScore | undefined {
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

  save(item: RegionalCreativeScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalCreativeScore[] {
    return this.inner.list();
  }
}

export function newCachedRegionalCreativeScoreStore(inner: RegionalCreativeScoreStore, ttl: number, clockValue: clock.Clock): RegionalCreativeScoreStore {
  return new CachedRegionalCreativeScoreStore(
    inner,
    cache.newTtlCache<RegionalCreativeScore>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional creative scores. Empty fields match all. */
export class RegionalCreativeScoreQuery {
  name: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minWindowDays: number, statuses: string[], limit: number) {
    this.name = name;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalCreativeScore): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalCreativeScore[]): RegionalCreativeScore[] {
    const matched = collections.filter(items, (candidate: RegionalCreativeScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalCreativeScores(store: RegionalCreativeScoreStore, query: RegionalCreativeScoreQuery): RegionalCreativeScore[] {
  return query.apply(store.list());
}
