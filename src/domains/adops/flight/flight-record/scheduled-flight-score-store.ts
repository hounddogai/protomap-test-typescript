import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledFlightScore } from "./scheduled-flight-score.js";

/** Keeps scheduled flight scores by code. */
export interface ScheduledFlightScoreStore {
  find(code: string): ScheduledFlightScore | undefined;
  save(item: ScheduledFlightScore): void;
  remove(code: string): boolean;
  list(): ScheduledFlightScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledFlightScoreStore implements ScheduledFlightScoreStore {
  items: Map<string, ScheduledFlightScore>;
  order: string[];

  constructor(items: Map<string, ScheduledFlightScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledFlightScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledFlightScore): void {
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

  list(): ScheduledFlightScore[] {
    const out: ScheduledFlightScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledFlightScoreStore(): ScheduledFlightScoreStore {
  return new MemoryScheduledFlightScoreStore(new Map<string, ScheduledFlightScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledFlightScoreStore implements ScheduledFlightScoreStore {
  inner: ScheduledFlightScoreStore;
  cache: cache.TtlCache<ScheduledFlightScore>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledFlightScoreStore,
    cacheValue: cache.TtlCache<ScheduledFlightScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledFlightScore | undefined {
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

  save(item: ScheduledFlightScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledFlightScore[] {
    return this.inner.list();
  }
}

export function newCachedScheduledFlightScoreStore(inner: ScheduledFlightScoreStore, ttl: number, clockValue: clock.Clock): ScheduledFlightScoreStore {
  return new CachedScheduledFlightScoreStore(inner, cache.newTtlCache<ScheduledFlightScore>(64, ttl, clockValue), 0, 0);
}

/** Selects scheduled flight scores. Empty fields match all. */
export class ScheduledFlightScoreQuery {
  title: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minFloorValue: number, statuses: string[], limit: number) {
    this.title = title;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledFlightScore): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledFlightScore[]): ScheduledFlightScore[] {
    const matched = collections.filter(items, (candidate: ScheduledFlightScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledFlightScores(store: ScheduledFlightScoreStore, query: ScheduledFlightScoreQuery): ScheduledFlightScore[] {
  return query.apply(store.list());
}
