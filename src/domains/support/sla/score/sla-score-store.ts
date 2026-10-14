import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SlaScore } from "./sla-score.js";

/** Keeps sla scores by code. */
export interface SlaScoreStore {
  find(code: string): SlaScore | undefined;
  save(item: SlaScore): void;
  remove(code: string): boolean;
  list(): SlaScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySlaScoreStore implements SlaScoreStore {
  items: Map<string, SlaScore>;
  order: string[];

  constructor(items: Map<string, SlaScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SlaScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SlaScore): void {
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

  list(): SlaScore[] {
    const out: SlaScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySlaScoreStore(): SlaScoreStore {
  return new MemorySlaScoreStore(new Map<string, SlaScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSlaScoreStore implements SlaScoreStore {
  inner: SlaScoreStore;
  cache: cache.TtlCache<SlaScore>;
  hits: number;
  misses: number;

  constructor(inner: SlaScoreStore, cacheValue: cache.TtlCache<SlaScore>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SlaScore | undefined {
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

  save(item: SlaScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SlaScore[] {
    return this.inner.list();
  }
}

export function newCachedSlaScoreStore(inner: SlaScoreStore, ttl: number, clockValue: clock.Clock): SlaScoreStore {
  return new CachedSlaScoreStore(inner, cache.newTtlCache<SlaScore>(128, ttl, clockValue), 0, 0);
}

/** Selects sla scores. Empty fields match all. */
export class SlaScoreQuery {
  title: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCapacity: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SlaScore): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SlaScore[]): SlaScore[] {
    const matched = collections.filter(items, (candidate: SlaScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSlaScores(store: SlaScoreStore, query: SlaScoreQuery): SlaScore[] {
  return query.apply(store.list());
}
