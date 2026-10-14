import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { JourneyScore } from "./journey-score.js";

/** Keeps journey scores by code. */
export interface JourneyScoreStore {
  find(code: string): JourneyScore | undefined;
  save(item: JourneyScore): void;
  remove(code: string): boolean;
  list(): JourneyScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryJourneyScoreStore implements JourneyScoreStore {
  items: Map<string, JourneyScore>;
  order: string[];

  constructor(items: Map<string, JourneyScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): JourneyScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: JourneyScore): void {
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

  list(): JourneyScore[] {
    const out: JourneyScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryJourneyScoreStore(): JourneyScoreStore {
  return new MemoryJourneyScoreStore(new Map<string, JourneyScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedJourneyScoreStore implements JourneyScoreStore {
  inner: JourneyScoreStore;
  cache: cache.TtlCache<JourneyScore>;
  hits: number;
  misses: number;

  constructor(inner: JourneyScoreStore, cacheValue: cache.TtlCache<JourneyScore>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): JourneyScore | undefined {
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

  save(item: JourneyScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): JourneyScore[] {
    return this.inner.list();
  }
}

export function newCachedJourneyScoreStore(inner: JourneyScoreStore, ttl: number, clockValue: clock.Clock): JourneyScoreStore {
  return new CachedJourneyScoreStore(inner, cache.newTtlCache<JourneyScore>(256, ttl, clockValue), 0, 0);
}

/** Selects journey scores. Empty fields match all. */
export class JourneyScoreQuery {
  source: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minScore: number, statuses: string[], limit: number) {
    this.source = source;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: JourneyScore): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: JourneyScore[]): JourneyScore[] {
    const matched = collections.filter(items, (candidate: JourneyScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findJourneyScores(store: JourneyScoreStore, query: JourneyScoreQuery): JourneyScore[] {
  return query.apply(store.list());
}
