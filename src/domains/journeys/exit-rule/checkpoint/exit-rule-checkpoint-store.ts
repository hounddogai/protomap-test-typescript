import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ExitRuleCheckpoint } from "./exit-rule-checkpoint.js";

/** Keeps exit rule checkpoints by code. */
export interface ExitRuleCheckpointStore {
  find(code: string): ExitRuleCheckpoint | undefined;
  save(item: ExitRuleCheckpoint): void;
  remove(code: string): boolean;
  list(): ExitRuleCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryExitRuleCheckpointStore implements ExitRuleCheckpointStore {
  items: Map<string, ExitRuleCheckpoint>;
  order: string[];

  constructor(items: Map<string, ExitRuleCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ExitRuleCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ExitRuleCheckpoint): void {
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

  list(): ExitRuleCheckpoint[] {
    const out: ExitRuleCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryExitRuleCheckpointStore(): ExitRuleCheckpointStore {
  return new MemoryExitRuleCheckpointStore(new Map<string, ExitRuleCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedExitRuleCheckpointStore implements ExitRuleCheckpointStore {
  inner: ExitRuleCheckpointStore;
  cache: cache.TtlCache<ExitRuleCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: ExitRuleCheckpointStore,
    cacheValue: cache.TtlCache<ExitRuleCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ExitRuleCheckpoint | undefined {
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

  save(item: ExitRuleCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ExitRuleCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedExitRuleCheckpointStore(inner: ExitRuleCheckpointStore, ttl: number, clockValue: clock.Clock): ExitRuleCheckpointStore {
  return new CachedExitRuleCheckpointStore(inner, cache.newTtlCache<ExitRuleCheckpoint>(128, ttl, clockValue), 0, 0);
}

/** Selects exit rule checkpoints. Empty fields match all. */
export class ExitRuleCheckpointQuery {
  title: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minBid: number, statuses: string[], limit: number) {
    this.title = title;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ExitRuleCheckpoint): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ExitRuleCheckpoint[]): ExitRuleCheckpoint[] {
    const matched = collections.filter(items, (candidate: ExitRuleCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findExitRuleCheckpoints(store: ExitRuleCheckpointStore, query: ExitRuleCheckpointQuery): ExitRuleCheckpoint[] {
  return query.apply(store.list());
}
