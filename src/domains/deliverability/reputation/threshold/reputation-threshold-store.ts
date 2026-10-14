import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReputationThreshold } from "./reputation-threshold.js";

/** Keeps reputation thresholds by code. */
export interface ReputationThresholdStore {
  find(code: string): ReputationThreshold | undefined;
  save(item: ReputationThreshold): void;
  remove(code: string): boolean;
  list(): ReputationThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReputationThresholdStore implements ReputationThresholdStore {
  items: Map<string, ReputationThreshold>;
  order: string[];

  constructor(items: Map<string, ReputationThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReputationThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReputationThreshold): void {
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

  list(): ReputationThreshold[] {
    const out: ReputationThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReputationThresholdStore(): ReputationThresholdStore {
  return new MemoryReputationThresholdStore(new Map<string, ReputationThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReputationThresholdStore implements ReputationThresholdStore {
  inner: ReputationThresholdStore;
  cache: cache.TtlCache<ReputationThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: ReputationThresholdStore,
    cacheValue: cache.TtlCache<ReputationThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReputationThreshold | undefined {
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

  save(item: ReputationThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReputationThreshold[] {
    return this.inner.list();
  }
}

export function newCachedReputationThresholdStore(inner: ReputationThresholdStore, ttl: number, clockValue: clock.Clock): ReputationThresholdStore {
  return new CachedReputationThresholdStore(inner, cache.newTtlCache<ReputationThreshold>(64, ttl, clockValue), 0, 0);
}

/** Selects reputation thresholds. Empty fields match all. */
export class ReputationThresholdQuery {
  label: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minAttempts: number, statuses: string[], limit: number) {
    this.label = label;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReputationThreshold): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReputationThreshold[]): ReputationThreshold[] {
    const matched = collections.filter(items, (candidate: ReputationThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReputationThresholds(store: ReputationThresholdStore, query: ReputationThresholdQuery): ReputationThreshold[] {
  return query.apply(store.list());
}
