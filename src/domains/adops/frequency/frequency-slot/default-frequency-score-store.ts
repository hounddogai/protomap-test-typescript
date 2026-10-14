import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultFrequencyScore } from "./default-frequency-score.js";

/** Keeps default frequency scores by code. */
export interface DefaultFrequencyScoreStore {
  find(code: string): DefaultFrequencyScore | undefined;
  save(item: DefaultFrequencyScore): void;
  remove(code: string): boolean;
  list(): DefaultFrequencyScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultFrequencyScoreStore implements DefaultFrequencyScoreStore {
  items: Map<string, DefaultFrequencyScore>;
  order: string[];

  constructor(items: Map<string, DefaultFrequencyScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultFrequencyScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultFrequencyScore): void {
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

  list(): DefaultFrequencyScore[] {
    const out: DefaultFrequencyScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultFrequencyScoreStore(): DefaultFrequencyScoreStore {
  return new MemoryDefaultFrequencyScoreStore(new Map<string, DefaultFrequencyScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultFrequencyScoreStore implements DefaultFrequencyScoreStore {
  inner: DefaultFrequencyScoreStore;
  cache: cache.TtlCache<DefaultFrequencyScore>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultFrequencyScoreStore,
    cacheValue: cache.TtlCache<DefaultFrequencyScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultFrequencyScore | undefined {
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

  save(item: DefaultFrequencyScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultFrequencyScore[] {
    return this.inner.list();
  }
}

export function newCachedDefaultFrequencyScoreStore(inner: DefaultFrequencyScoreStore, ttl: number, clockValue: clock.Clock): DefaultFrequencyScoreStore {
  return new CachedDefaultFrequencyScoreStore(
    inner,
    cache.newTtlCache<DefaultFrequencyScore>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default frequency scores. Empty fields match all. */
export class DefaultFrequencyScoreQuery {
  name: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minThreshold: number, statuses: string[], limit: number) {
    this.name = name;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultFrequencyScore): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultFrequencyScore[]): DefaultFrequencyScore[] {
    const matched = collections.filter(items, (candidate: DefaultFrequencyScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultFrequencyScores(store: DefaultFrequencyScoreStore, query: DefaultFrequencyScoreQuery): DefaultFrequencyScore[] {
  return query.apply(store.list());
}
