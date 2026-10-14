import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ChallengeDraft } from "./challenge-draft.js";

/** Keeps challenge drafts by code. */
export interface ChallengeDraftStore {
  find(code: string): ChallengeDraft | undefined;
  save(item: ChallengeDraft): void;
  remove(code: string): boolean;
  list(): ChallengeDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryChallengeDraftStore implements ChallengeDraftStore {
  items: Map<string, ChallengeDraft>;
  order: string[];

  constructor(items: Map<string, ChallengeDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ChallengeDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ChallengeDraft): void {
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

  list(): ChallengeDraft[] {
    const out: ChallengeDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryChallengeDraftStore(): ChallengeDraftStore {
  return new MemoryChallengeDraftStore(new Map<string, ChallengeDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedChallengeDraftStore implements ChallengeDraftStore {
  inner: ChallengeDraftStore;
  cache: cache.TtlCache<ChallengeDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: ChallengeDraftStore,
    cacheValue: cache.TtlCache<ChallengeDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ChallengeDraft | undefined {
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

  save(item: ChallengeDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ChallengeDraft[] {
    return this.inner.list();
  }
}

export function newCachedChallengeDraftStore(inner: ChallengeDraftStore, ttl: number, clockValue: clock.Clock): ChallengeDraftStore {
  return new CachedChallengeDraftStore(inner, cache.newTtlCache<ChallengeDraft>(64, ttl, clockValue), 0, 0);
}

/** Selects challenge drafts. Empty fields match all. */
export class ChallengeDraftQuery {
  unit: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minWindowDays: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ChallengeDraft): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ChallengeDraft[]): ChallengeDraft[] {
    const matched = collections.filter(items, (candidate: ChallengeDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findChallengeDrafts(store: ChallengeDraftStore, query: ChallengeDraftQuery): ChallengeDraft[] {
  return query.apply(store.list());
}
