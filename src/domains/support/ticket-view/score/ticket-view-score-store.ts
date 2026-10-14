import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TicketViewScore } from "./ticket-view-score.js";

/** Keeps ticket view scores by code. */
export interface TicketViewScoreStore {
  find(code: string): TicketViewScore | undefined;
  save(item: TicketViewScore): void;
  remove(code: string): boolean;
  list(): TicketViewScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTicketViewScoreStore implements TicketViewScoreStore {
  items: Map<string, TicketViewScore>;
  order: string[];

  constructor(items: Map<string, TicketViewScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TicketViewScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TicketViewScore): void {
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

  list(): TicketViewScore[] {
    const out: TicketViewScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTicketViewScoreStore(): TicketViewScoreStore {
  return new MemoryTicketViewScoreStore(new Map<string, TicketViewScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTicketViewScoreStore implements TicketViewScoreStore {
  inner: TicketViewScoreStore;
  cache: cache.TtlCache<TicketViewScore>;
  hits: number;
  misses: number;

  constructor(
    inner: TicketViewScoreStore,
    cacheValue: cache.TtlCache<TicketViewScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TicketViewScore | undefined {
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

  save(item: TicketViewScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TicketViewScore[] {
    return this.inner.list();
  }
}

export function newCachedTicketViewScoreStore(inner: TicketViewScoreStore, ttl: number, clockValue: clock.Clock): TicketViewScoreStore {
  return new CachedTicketViewScoreStore(inner, cache.newTtlCache<TicketViewScore>(512, ttl, clockValue), 0, 0);
}

/** Selects ticket view scores. Empty fields match all. */
export class TicketViewScoreQuery {
  region: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minWeight: number, statuses: string[], limit: number) {
    this.region = region;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TicketViewScore): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TicketViewScore[]): TicketViewScore[] {
    const matched = collections.filter(items, (candidate: TicketViewScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTicketViewScores(store: TicketViewScoreStore, query: TicketViewScoreQuery): TicketViewScore[] {
  return query.apply(store.list());
}
