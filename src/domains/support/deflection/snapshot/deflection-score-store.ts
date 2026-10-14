import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DeflectionScore } from "./deflection-score.js";

/** Keeps deflection scores by code. */
export interface DeflectionScoreStore {
  find(code: string): DeflectionScore | undefined;
  save(item: DeflectionScore): void;
  remove(code: string): boolean;
  list(): DeflectionScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDeflectionScoreStore implements DeflectionScoreStore {
  items: Map<string, DeflectionScore>;
  order: string[];

  constructor(items: Map<string, DeflectionScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DeflectionScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DeflectionScore): void {
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

  list(): DeflectionScore[] {
    const out: DeflectionScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDeflectionScoreStore(): DeflectionScoreStore {
  return new MemoryDeflectionScoreStore(new Map<string, DeflectionScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDeflectionScoreStore implements DeflectionScoreStore {
  inner: DeflectionScoreStore;
  cache: cache.TtlCache<DeflectionScore>;
  hits: number;
  misses: number;

  constructor(
    inner: DeflectionScoreStore,
    cacheValue: cache.TtlCache<DeflectionScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DeflectionScore | undefined {
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

  save(item: DeflectionScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DeflectionScore[] {
    return this.inner.list();
  }
}

export function newCachedDeflectionScoreStore(inner: DeflectionScoreStore, ttl: number, clockValue: clock.Clock): DeflectionScoreStore {
  return new CachedDeflectionScoreStore(inner, cache.newTtlCache<DeflectionScore>(256, ttl, clockValue), 0, 0);
}

/** Selects deflection scores. Empty fields match all. */
export class DeflectionScoreQuery {
  channel: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minWindowDays: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DeflectionScore): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DeflectionScore[]): DeflectionScore[] {
    const matched = collections.filter(items, (candidate: DeflectionScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDeflectionScores(store: DeflectionScoreStore, query: DeflectionScoreQuery): DeflectionScore[] {
  return query.apply(store.list());
}
