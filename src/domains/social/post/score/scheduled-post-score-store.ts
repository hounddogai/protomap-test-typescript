import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledPostScore } from "./scheduled-post-score.js";

/** Keeps scheduled post scores by code. */
export interface ScheduledPostScoreStore {
  find(code: string): ScheduledPostScore | undefined;
  save(item: ScheduledPostScore): void;
  remove(code: string): boolean;
  list(): ScheduledPostScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledPostScoreStore implements ScheduledPostScoreStore {
  items: Map<string, ScheduledPostScore>;
  order: string[];

  constructor(items: Map<string, ScheduledPostScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledPostScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledPostScore): void {
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

  list(): ScheduledPostScore[] {
    const out: ScheduledPostScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledPostScoreStore(): ScheduledPostScoreStore {
  return new MemoryScheduledPostScoreStore(new Map<string, ScheduledPostScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledPostScoreStore implements ScheduledPostScoreStore {
  inner: ScheduledPostScoreStore;
  cache: cache.TtlCache<ScheduledPostScore>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledPostScoreStore,
    cacheValue: cache.TtlCache<ScheduledPostScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledPostScore | undefined {
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

  save(item: ScheduledPostScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledPostScore[] {
    return this.inner.list();
  }
}

export function newCachedScheduledPostScoreStore(inner: ScheduledPostScoreStore, ttl: number, clockValue: clock.Clock): ScheduledPostScoreStore {
  return new CachedScheduledPostScoreStore(inner, cache.newTtlCache<ScheduledPostScore>(256, ttl, clockValue), 0, 0);
}

/** Selects scheduled post scores. Empty fields match all. */
export class ScheduledPostScoreQuery {
  title: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRetries: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledPostScore): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledPostScore[]): ScheduledPostScore[] {
    const matched = collections.filter(items, (candidate: ScheduledPostScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledPostScores(store: ScheduledPostScoreStore, query: ScheduledPostScoreQuery): ScheduledPostScore[] {
  return query.apply(store.list());
}
