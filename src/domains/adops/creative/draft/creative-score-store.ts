import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreativeScore } from "./creative-score.js";

/** Keeps creative scores by code. */
export interface CreativeScoreStore {
  find(code: string): CreativeScore | undefined;
  save(item: CreativeScore): void;
  remove(code: string): boolean;
  list(): CreativeScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreativeScoreStore implements CreativeScoreStore {
  items: Map<string, CreativeScore>;
  order: string[];

  constructor(items: Map<string, CreativeScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreativeScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreativeScore): void {
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

  list(): CreativeScore[] {
    const out: CreativeScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreativeScoreStore(): CreativeScoreStore {
  return new MemoryCreativeScoreStore(new Map<string, CreativeScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreativeScoreStore implements CreativeScoreStore {
  inner: CreativeScoreStore;
  cache: cache.TtlCache<CreativeScore>;
  hits: number;
  misses: number;

  constructor(inner: CreativeScoreStore, cacheValue: cache.TtlCache<CreativeScore>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreativeScore | undefined {
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

  save(item: CreativeScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreativeScore[] {
    return this.inner.list();
  }
}

export function newCachedCreativeScoreStore(inner: CreativeScoreStore, ttl: number, clockValue: clock.Clock): CreativeScoreStore {
  return new CachedCreativeScoreStore(inner, cache.newTtlCache<CreativeScore>(128, ttl, clockValue), 0, 0);
}

/** Selects creative scores. Empty fields match all. */
export class CreativeScoreQuery {
  region: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.region = region;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreativeScore): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreativeScore[]): CreativeScore[] {
    const matched = collections.filter(items, (candidate: CreativeScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreativeScores(store: CreativeScoreStore, query: CreativeScoreQuery): CreativeScore[] {
  return query.apply(store.list());
}
