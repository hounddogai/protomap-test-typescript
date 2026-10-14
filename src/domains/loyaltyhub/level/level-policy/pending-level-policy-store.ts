import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingLevelPolicy } from "./pending-level-policy.js";

/** Keeps pending level policies by code. */
export interface PendingLevelPolicyStore {
  find(code: string): PendingLevelPolicy | undefined;
  save(item: PendingLevelPolicy): void;
  remove(code: string): boolean;
  list(): PendingLevelPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingLevelPolicyStore implements PendingLevelPolicyStore {
  items: Map<string, PendingLevelPolicy>;
  order: string[];

  constructor(items: Map<string, PendingLevelPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingLevelPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingLevelPolicy): void {
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

  list(): PendingLevelPolicy[] {
    const out: PendingLevelPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingLevelPolicyStore(): PendingLevelPolicyStore {
  return new MemoryPendingLevelPolicyStore(new Map<string, PendingLevelPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingLevelPolicyStore implements PendingLevelPolicyStore {
  inner: PendingLevelPolicyStore;
  cache: cache.TtlCache<PendingLevelPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingLevelPolicyStore,
    cacheValue: cache.TtlCache<PendingLevelPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingLevelPolicy | undefined {
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

  save(item: PendingLevelPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingLevelPolicy[] {
    return this.inner.list();
  }
}

export function newCachedPendingLevelPolicyStore(inner: PendingLevelPolicyStore, ttl: number, clockValue: clock.Clock): PendingLevelPolicyStore {
  return new CachedPendingLevelPolicyStore(inner, cache.newTtlCache<PendingLevelPolicy>(512, ttl, clockValue), 0, 0);
}

/** Selects pending level policies. Empty fields match all. */
export class PendingLevelPolicyQuery {
  source: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minSequence: number, statuses: string[], limit: number) {
    this.source = source;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingLevelPolicy): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingLevelPolicy[]): PendingLevelPolicy[] {
    const matched = collections.filter(items, (candidate: PendingLevelPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingLevelPolicies(store: PendingLevelPolicyStore, query: PendingLevelPolicyQuery): PendingLevelPolicy[] {
  return query.apply(store.list());
}
