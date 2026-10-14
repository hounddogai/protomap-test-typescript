import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReplyScore } from "./reply-score.js";

/** Keeps reply scores by code. */
export interface ReplyScoreStore {
  find(code: string): ReplyScore | undefined;
  save(item: ReplyScore): void;
  remove(code: string): boolean;
  list(): ReplyScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReplyScoreStore implements ReplyScoreStore {
  items: Map<string, ReplyScore>;
  order: string[];

  constructor(items: Map<string, ReplyScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReplyScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReplyScore): void {
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

  list(): ReplyScore[] {
    const out: ReplyScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReplyScoreStore(): ReplyScoreStore {
  return new MemoryReplyScoreStore(new Map<string, ReplyScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReplyScoreStore implements ReplyScoreStore {
  inner: ReplyScoreStore;
  cache: cache.TtlCache<ReplyScore>;
  hits: number;
  misses: number;

  constructor(inner: ReplyScoreStore, cacheValue: cache.TtlCache<ReplyScore>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReplyScore | undefined {
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

  save(item: ReplyScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReplyScore[] {
    return this.inner.list();
  }
}

export function newCachedReplyScoreStore(inner: ReplyScoreStore, ttl: number, clockValue: clock.Clock): ReplyScoreStore {
  return new CachedReplyScoreStore(inner, cache.newTtlCache<ReplyScore>(128, ttl, clockValue), 0, 0);
}

/** Selects reply scores. Empty fields match all. */
export class ReplyScoreQuery {
  locale: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minEndsAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReplyScore): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReplyScore[]): ReplyScore[] {
    const matched = collections.filter(items, (candidate: ReplyScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReplyScores(store: ReplyScoreStore, query: ReplyScoreQuery): ReplyScore[] {
  return query.apply(store.list());
}
