import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientPreferenceRollup } from "./lenient-preference-rollup.js";

/** Keeps lenient preference rollups by code. */
export interface LenientPreferenceRollupStore {
  find(code: string): LenientPreferenceRollup | undefined;
  save(item: LenientPreferenceRollup): void;
  remove(code: string): boolean;
  list(): LenientPreferenceRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientPreferenceRollupStore implements LenientPreferenceRollupStore {
  items: Map<string, LenientPreferenceRollup>;
  order: string[];

  constructor(items: Map<string, LenientPreferenceRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientPreferenceRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientPreferenceRollup): void {
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

  list(): LenientPreferenceRollup[] {
    const out: LenientPreferenceRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientPreferenceRollupStore(): LenientPreferenceRollupStore {
  return new MemoryLenientPreferenceRollupStore(new Map<string, LenientPreferenceRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientPreferenceRollupStore implements LenientPreferenceRollupStore {
  inner: LenientPreferenceRollupStore;
  cache: cache.TtlCache<LenientPreferenceRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientPreferenceRollupStore,
    cacheValue: cache.TtlCache<LenientPreferenceRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientPreferenceRollup | undefined {
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

  save(item: LenientPreferenceRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientPreferenceRollup[] {
    return this.inner.list();
  }
}

export function newCachedLenientPreferenceRollupStore(inner: LenientPreferenceRollupStore, ttl: number, clockValue: clock.Clock): LenientPreferenceRollupStore {
  return new CachedLenientPreferenceRollupStore(
    inner,
    cache.newTtlCache<LenientPreferenceRollup>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient preference rollups. Empty fields match all. */
export class LenientPreferenceRollupQuery {
  channel: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minScore: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientPreferenceRollup): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientPreferenceRollup[]): LenientPreferenceRollup[] {
    const matched = collections.filter(items, (candidate: LenientPreferenceRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientPreferenceRollups(store: LenientPreferenceRollupStore, query: LenientPreferenceRollupQuery): LenientPreferenceRollup[] {
  return query.apply(store.list());
}
