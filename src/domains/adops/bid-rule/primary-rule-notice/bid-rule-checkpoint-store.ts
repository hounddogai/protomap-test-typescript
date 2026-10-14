import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BidRuleCheckpoint } from "./bid-rule-checkpoint.js";

/** Keeps bid rule checkpoints by code. */
export interface BidRuleCheckpointStore {
  find(code: string): BidRuleCheckpoint | undefined;
  save(item: BidRuleCheckpoint): void;
  remove(code: string): boolean;
  list(): BidRuleCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBidRuleCheckpointStore implements BidRuleCheckpointStore {
  items: Map<string, BidRuleCheckpoint>;
  order: string[];

  constructor(items: Map<string, BidRuleCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BidRuleCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BidRuleCheckpoint): void {
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

  list(): BidRuleCheckpoint[] {
    const out: BidRuleCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBidRuleCheckpointStore(): BidRuleCheckpointStore {
  return new MemoryBidRuleCheckpointStore(new Map<string, BidRuleCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBidRuleCheckpointStore implements BidRuleCheckpointStore {
  inner: BidRuleCheckpointStore;
  cache: cache.TtlCache<BidRuleCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: BidRuleCheckpointStore,
    cacheValue: cache.TtlCache<BidRuleCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BidRuleCheckpoint | undefined {
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

  save(item: BidRuleCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BidRuleCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedBidRuleCheckpointStore(inner: BidRuleCheckpointStore, ttl: number, clockValue: clock.Clock): BidRuleCheckpointStore {
  return new CachedBidRuleCheckpointStore(inner, cache.newTtlCache<BidRuleCheckpoint>(64, ttl, clockValue), 0, 0);
}

/** Selects bid rule checkpoints. Empty fields match all. */
export class BidRuleCheckpointQuery {
  label: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMaximum: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BidRuleCheckpoint): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BidRuleCheckpoint[]): BidRuleCheckpoint[] {
    const matched = collections.filter(items, (candidate: BidRuleCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBidRuleCheckpoints(store: BidRuleCheckpointStore, query: BidRuleCheckpointQuery): BidRuleCheckpoint[] {
  return query.apply(store.list());
}
