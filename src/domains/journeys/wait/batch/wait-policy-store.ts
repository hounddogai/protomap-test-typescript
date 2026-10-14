import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WaitPolicy } from "./wait-policy.js";

/** Keeps wait policies by code. */
export interface WaitPolicyStore {
  find(code: string): WaitPolicy | undefined;
  save(item: WaitPolicy): void;
  remove(code: string): boolean;
  list(): WaitPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWaitPolicyStore implements WaitPolicyStore {
  items: Map<string, WaitPolicy>;
  order: string[];

  constructor(items: Map<string, WaitPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WaitPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WaitPolicy): void {
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

  list(): WaitPolicy[] {
    const out: WaitPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWaitPolicyStore(): WaitPolicyStore {
  return new MemoryWaitPolicyStore(new Map<string, WaitPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWaitPolicyStore implements WaitPolicyStore {
  inner: WaitPolicyStore;
  cache: cache.TtlCache<WaitPolicy>;
  hits: number;
  misses: number;

  constructor(inner: WaitPolicyStore, cacheValue: cache.TtlCache<WaitPolicy>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WaitPolicy | undefined {
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

  save(item: WaitPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WaitPolicy[] {
    return this.inner.list();
  }
}

export function newCachedWaitPolicyStore(inner: WaitPolicyStore, ttl: number, clockValue: clock.Clock): WaitPolicyStore {
  return new CachedWaitPolicyStore(inner, cache.newTtlCache<WaitPolicy>(512, ttl, clockValue), 0, 0);
}

/** Selects wait policies. Empty fields match all. */
export class WaitPolicyQuery {
  source: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.source = source;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WaitPolicy): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WaitPolicy[]): WaitPolicy[] {
    const matched = collections.filter(items, (candidate: WaitPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWaitPolicies(store: WaitPolicyStore, query: WaitPolicyQuery): WaitPolicy[] {
  return query.apply(store.list());
}
