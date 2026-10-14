import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultJourneyScore } from "./default-journey-score.js";

/** Keeps default journey scores by code. */
export interface DefaultJourneyScoreStore {
  find(code: string): DefaultJourneyScore | undefined;
  save(item: DefaultJourneyScore): void;
  remove(code: string): boolean;
  list(): DefaultJourneyScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultJourneyScoreStore implements DefaultJourneyScoreStore {
  items: Map<string, DefaultJourneyScore>;
  order: string[];

  constructor(items: Map<string, DefaultJourneyScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultJourneyScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultJourneyScore): void {
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

  list(): DefaultJourneyScore[] {
    const out: DefaultJourneyScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultJourneyScoreStore(): DefaultJourneyScoreStore {
  return new MemoryDefaultJourneyScoreStore(new Map<string, DefaultJourneyScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultJourneyScoreStore implements DefaultJourneyScoreStore {
  inner: DefaultJourneyScoreStore;
  cache: cache.TtlCache<DefaultJourneyScore>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultJourneyScoreStore,
    cacheValue: cache.TtlCache<DefaultJourneyScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultJourneyScore | undefined {
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

  save(item: DefaultJourneyScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultJourneyScore[] {
    return this.inner.list();
  }
}

export function newCachedDefaultJourneyScoreStore(inner: DefaultJourneyScoreStore, ttl: number, clockValue: clock.Clock): DefaultJourneyScoreStore {
  return new CachedDefaultJourneyScoreStore(inner, cache.newTtlCache<DefaultJourneyScore>(64, ttl, clockValue), 0, 0);
}

/** Selects default journey scores. Empty fields match all. */
export class DefaultJourneyScoreQuery {
  locale: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minQuantity: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultJourneyScore): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultJourneyScore[]): DefaultJourneyScore[] {
    const matched = collections.filter(items, (candidate: DefaultJourneyScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultJourneyScores(store: DefaultJourneyScoreStore, query: DefaultJourneyScoreQuery): DefaultJourneyScore[] {
  return query.apply(store.list());
}
