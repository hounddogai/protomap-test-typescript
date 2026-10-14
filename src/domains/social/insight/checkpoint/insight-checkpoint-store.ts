import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InsightCheckpoint } from "./insight-checkpoint.js";

/** Keeps insight checkpoints by code. */
export interface InsightCheckpointStore {
  find(code: string): InsightCheckpoint | undefined;
  save(item: InsightCheckpoint): void;
  remove(code: string): boolean;
  list(): InsightCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInsightCheckpointStore implements InsightCheckpointStore {
  items: Map<string, InsightCheckpoint>;
  order: string[];

  constructor(items: Map<string, InsightCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InsightCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InsightCheckpoint): void {
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

  list(): InsightCheckpoint[] {
    const out: InsightCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInsightCheckpointStore(): InsightCheckpointStore {
  return new MemoryInsightCheckpointStore(new Map<string, InsightCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInsightCheckpointStore implements InsightCheckpointStore {
  inner: InsightCheckpointStore;
  cache: cache.TtlCache<InsightCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: InsightCheckpointStore,
    cacheValue: cache.TtlCache<InsightCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InsightCheckpoint | undefined {
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

  save(item: InsightCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InsightCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedInsightCheckpointStore(inner: InsightCheckpointStore, ttl: number, clockValue: clock.Clock): InsightCheckpointStore {
  return new CachedInsightCheckpointStore(inner, cache.newTtlCache<InsightCheckpoint>(128, ttl, clockValue), 0, 0);
}

/** Selects insight checkpoints. Empty fields match all. */
export class InsightCheckpointQuery {
  segment: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minScore: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InsightCheckpoint): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InsightCheckpoint[]): InsightCheckpoint[] {
    const matched = collections.filter(items, (candidate: InsightCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInsightCheckpoints(store: InsightCheckpointStore, query: InsightCheckpointQuery): InsightCheckpoint[] {
  return query.apply(store.list());
}
