import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyStepScore } from "./legacy-step-score.js";

/** Keeps legacy step scores by code. */
export interface LegacyStepScoreStore {
  find(code: string): LegacyStepScore | undefined;
  save(item: LegacyStepScore): void;
  remove(code: string): boolean;
  list(): LegacyStepScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyStepScoreStore implements LegacyStepScoreStore {
  items: Map<string, LegacyStepScore>;
  order: string[];

  constructor(items: Map<string, LegacyStepScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyStepScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyStepScore): void {
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

  list(): LegacyStepScore[] {
    const out: LegacyStepScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyStepScoreStore(): LegacyStepScoreStore {
  return new MemoryLegacyStepScoreStore(new Map<string, LegacyStepScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyStepScoreStore implements LegacyStepScoreStore {
  inner: LegacyStepScoreStore;
  cache: cache.TtlCache<LegacyStepScore>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyStepScoreStore,
    cacheValue: cache.TtlCache<LegacyStepScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyStepScore | undefined {
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

  save(item: LegacyStepScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyStepScore[] {
    return this.inner.list();
  }
}

export function newCachedLegacyStepScoreStore(inner: LegacyStepScoreStore, ttl: number, clockValue: clock.Clock): LegacyStepScoreStore {
  return new CachedLegacyStepScoreStore(inner, cache.newTtlCache<LegacyStepScore>(64, ttl, clockValue), 0, 0);
}

/** Selects legacy step scores. Empty fields match all. */
export class LegacyStepScoreQuery {
  channel: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minMaximum: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyStepScore): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyStepScore[]): LegacyStepScore[] {
    const matched = collections.filter(items, (candidate: LegacyStepScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyStepScores(store: LegacyStepScoreStore, query: LegacyStepScoreQuery): LegacyStepScore[] {
  return query.apply(store.list());
}
