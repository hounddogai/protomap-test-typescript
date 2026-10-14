import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MentionScore } from "./mention-score.js";

/** Keeps mention scores by code. */
export interface MentionScoreStore {
  find(code: string): MentionScore | undefined;
  save(item: MentionScore): void;
  remove(code: string): boolean;
  list(): MentionScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMentionScoreStore implements MentionScoreStore {
  items: Map<string, MentionScore>;
  order: string[];

  constructor(items: Map<string, MentionScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MentionScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MentionScore): void {
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

  list(): MentionScore[] {
    const out: MentionScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMentionScoreStore(): MentionScoreStore {
  return new MemoryMentionScoreStore(new Map<string, MentionScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMentionScoreStore implements MentionScoreStore {
  inner: MentionScoreStore;
  cache: cache.TtlCache<MentionScore>;
  hits: number;
  misses: number;

  constructor(inner: MentionScoreStore, cacheValue: cache.TtlCache<MentionScore>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MentionScore | undefined {
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

  save(item: MentionScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MentionScore[] {
    return this.inner.list();
  }
}

export function newCachedMentionScoreStore(inner: MentionScoreStore, ttl: number, clockValue: clock.Clock): MentionScoreStore {
  return new CachedMentionScoreStore(inner, cache.newTtlCache<MentionScore>(1024, ttl, clockValue), 0, 0);
}

/** Selects mention scores. Empty fields match all. */
export class MentionScoreQuery {
  source: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minVersion: number, statuses: string[], limit: number) {
    this.source = source;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MentionScore): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MentionScore[]): MentionScore[] {
    const matched = collections.filter(items, (candidate: MentionScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMentionScores(store: MentionScoreStore, query: MentionScoreQuery): MentionScore[] {
  return query.apply(store.list());
}
