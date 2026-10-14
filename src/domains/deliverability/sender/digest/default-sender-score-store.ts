import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultSenderScore } from "./default-sender-score.js";

/** Keeps default sender scores by code. */
export interface DefaultSenderScoreStore {
  find(code: string): DefaultSenderScore | undefined;
  save(item: DefaultSenderScore): void;
  remove(code: string): boolean;
  list(): DefaultSenderScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultSenderScoreStore implements DefaultSenderScoreStore {
  items: Map<string, DefaultSenderScore>;
  order: string[];

  constructor(items: Map<string, DefaultSenderScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultSenderScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultSenderScore): void {
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

  list(): DefaultSenderScore[] {
    const out: DefaultSenderScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultSenderScoreStore(): DefaultSenderScoreStore {
  return new MemoryDefaultSenderScoreStore(new Map<string, DefaultSenderScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultSenderScoreStore implements DefaultSenderScoreStore {
  inner: DefaultSenderScoreStore;
  cache: cache.TtlCache<DefaultSenderScore>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultSenderScoreStore,
    cacheValue: cache.TtlCache<DefaultSenderScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultSenderScore | undefined {
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

  save(item: DefaultSenderScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultSenderScore[] {
    return this.inner.list();
  }
}

export function newCachedDefaultSenderScoreStore(inner: DefaultSenderScoreStore, ttl: number, clockValue: clock.Clock): DefaultSenderScoreStore {
  return new CachedDefaultSenderScoreStore(inner, cache.newTtlCache<DefaultSenderScore>(512, ttl, clockValue), 0, 0);
}

/** Selects default sender scores. Empty fields match all. */
export class DefaultSenderScoreQuery {
  title: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minOpenRate: number, statuses: string[], limit: number) {
    this.title = title;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultSenderScore): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultSenderScore[]): DefaultSenderScore[] {
    const matched = collections.filter(items, (candidate: DefaultSenderScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultSenderScores(store: DefaultSenderScoreStore, query: DefaultSenderScoreQuery): DefaultSenderScore[] {
  return query.apply(store.list());
}
