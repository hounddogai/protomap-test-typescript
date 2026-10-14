import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientQueuePolicy } from "./lenient-queue-policy.js";

/** Keeps lenient queue policies by code. */
export interface LenientQueuePolicyStore {
  find(code: string): LenientQueuePolicy | undefined;
  save(item: LenientQueuePolicy): void;
  remove(code: string): boolean;
  list(): LenientQueuePolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientQueuePolicyStore implements LenientQueuePolicyStore {
  items: Map<string, LenientQueuePolicy>;
  order: string[];

  constructor(items: Map<string, LenientQueuePolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientQueuePolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientQueuePolicy): void {
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

  list(): LenientQueuePolicy[] {
    const out: LenientQueuePolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientQueuePolicyStore(): LenientQueuePolicyStore {
  return new MemoryLenientQueuePolicyStore(new Map<string, LenientQueuePolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientQueuePolicyStore implements LenientQueuePolicyStore {
  inner: LenientQueuePolicyStore;
  cache: cache.TtlCache<LenientQueuePolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientQueuePolicyStore,
    cacheValue: cache.TtlCache<LenientQueuePolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientQueuePolicy | undefined {
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

  save(item: LenientQueuePolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientQueuePolicy[] {
    return this.inner.list();
  }
}

export function newCachedLenientQueuePolicyStore(inner: LenientQueuePolicyStore, ttl: number, clockValue: clock.Clock): LenientQueuePolicyStore {
  return new CachedLenientQueuePolicyStore(inner, cache.newTtlCache<LenientQueuePolicy>(64, ttl, clockValue), 0, 0);
}

/** Selects lenient queue policies. Empty fields match all. */
export class LenientQueuePolicyQuery {
  name: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minWindowDays: number, statuses: string[], limit: number) {
    this.name = name;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientQueuePolicy): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientQueuePolicy[]): LenientQueuePolicy[] {
    const matched = collections.filter(items, (candidate: LenientQueuePolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientQueuePolicies(store: LenientQueuePolicyStore, query: LenientQueuePolicyQuery): LenientQueuePolicy[] {
  return query.apply(store.list());
}
