import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InviteScore } from "./invite-score.js";

/** Keeps invite scores by code. */
export interface InviteScoreStore {
  find(code: string): InviteScore | undefined;
  save(item: InviteScore): void;
  remove(code: string): boolean;
  list(): InviteScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInviteScoreStore implements InviteScoreStore {
  items: Map<string, InviteScore>;
  order: string[];

  constructor(items: Map<string, InviteScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InviteScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InviteScore): void {
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

  list(): InviteScore[] {
    const out: InviteScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInviteScoreStore(): InviteScoreStore {
  return new MemoryInviteScoreStore(new Map<string, InviteScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInviteScoreStore implements InviteScoreStore {
  inner: InviteScoreStore;
  cache: cache.TtlCache<InviteScore>;
  hits: number;
  misses: number;

  constructor(inner: InviteScoreStore, cacheValue: cache.TtlCache<InviteScore>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InviteScore | undefined {
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

  save(item: InviteScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InviteScore[] {
    return this.inner.list();
  }
}

export function newCachedInviteScoreStore(inner: InviteScoreStore, ttl: number, clockValue: clock.Clock): InviteScoreStore {
  return new CachedInviteScoreStore(inner, cache.newTtlCache<InviteScore>(256, ttl, clockValue), 0, 0);
}

/** Selects invite scores. Empty fields match all. */
export class InviteScoreQuery {
  title: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCost: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InviteScore): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InviteScore[]): InviteScore[] {
    const matched = collections.filter(items, (candidate: InviteScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInviteScores(store: InviteScoreStore, query: InviteScoreQuery): InviteScore[] {
  return query.apply(store.list());
}
