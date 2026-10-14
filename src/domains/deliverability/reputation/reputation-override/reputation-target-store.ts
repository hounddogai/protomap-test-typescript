import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReputationTarget } from "./reputation-target.js";

/** Keeps reputation targets by code. */
export interface ReputationTargetStore {
  find(code: string): ReputationTarget | undefined;
  save(item: ReputationTarget): void;
  remove(code: string): boolean;
  list(): ReputationTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReputationTargetStore implements ReputationTargetStore {
  items: Map<string, ReputationTarget>;
  order: string[];

  constructor(items: Map<string, ReputationTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReputationTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReputationTarget): void {
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

  list(): ReputationTarget[] {
    const out: ReputationTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReputationTargetStore(): ReputationTargetStore {
  return new MemoryReputationTargetStore(new Map<string, ReputationTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReputationTargetStore implements ReputationTargetStore {
  inner: ReputationTargetStore;
  cache: cache.TtlCache<ReputationTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: ReputationTargetStore,
    cacheValue: cache.TtlCache<ReputationTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReputationTarget | undefined {
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

  save(item: ReputationTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReputationTarget[] {
    return this.inner.list();
  }
}

export function newCachedReputationTargetStore(inner: ReputationTargetStore, ttl: number, clockValue: clock.Clock): ReputationTargetStore {
  return new CachedReputationTargetStore(inner, cache.newTtlCache<ReputationTarget>(256, ttl, clockValue), 0, 0);
}

/** Selects reputation targets. Empty fields match all. */
export class ReputationTargetQuery {
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

  matches(item: ReputationTarget): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReputationTarget[]): ReputationTarget[] {
    const matched = collections.filter(items, (candidate: ReputationTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReputationTargets(store: ReputationTargetStore, query: ReputationTargetQuery): ReputationTarget[] {
  return query.apply(store.list());
}
