import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultPostScore } from "./default-post-score.js";

/** Keeps default post scores by code. */
export interface DefaultPostScoreStore {
  find(code: string): DefaultPostScore | undefined;
  save(item: DefaultPostScore): void;
  remove(code: string): boolean;
  list(): DefaultPostScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultPostScoreStore implements DefaultPostScoreStore {
  items: Map<string, DefaultPostScore>;
  order: string[];

  constructor(items: Map<string, DefaultPostScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultPostScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultPostScore): void {
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

  list(): DefaultPostScore[] {
    const out: DefaultPostScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultPostScoreStore(): DefaultPostScoreStore {
  return new MemoryDefaultPostScoreStore(new Map<string, DefaultPostScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultPostScoreStore implements DefaultPostScoreStore {
  inner: DefaultPostScoreStore;
  cache: cache.TtlCache<DefaultPostScore>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultPostScoreStore,
    cacheValue: cache.TtlCache<DefaultPostScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultPostScore | undefined {
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

  save(item: DefaultPostScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultPostScore[] {
    return this.inner.list();
  }
}

export function newCachedDefaultPostScoreStore(inner: DefaultPostScoreStore, ttl: number, clockValue: clock.Clock): DefaultPostScoreStore {
  return new CachedDefaultPostScoreStore(inner, cache.newTtlCache<DefaultPostScore>(64, ttl, clockValue), 0, 0);
}

/** Selects default post scores. Empty fields match all. */
export class DefaultPostScoreQuery {
  name: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minMinimum: number, statuses: string[], limit: number) {
    this.name = name;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultPostScore): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultPostScore[]): DefaultPostScore[] {
    const matched = collections.filter(items, (candidate: DefaultPostScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultPostScores(store: DefaultPostScoreStore, query: DefaultPostScoreQuery): DefaultPostScore[] {
  return query.apply(store.list());
}
