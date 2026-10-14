import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RetentionPolicy } from "./retention-policy.js";

/** Keeps retention policies by code. */
export interface RetentionPolicyStore {
  find(code: string): RetentionPolicy | undefined;
  save(item: RetentionPolicy): void;
  remove(code: string): boolean;
  list(): RetentionPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRetentionPolicyStore implements RetentionPolicyStore {
  items: Map<string, RetentionPolicy>;
  order: string[];

  constructor(items: Map<string, RetentionPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RetentionPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RetentionPolicy): void {
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

  list(): RetentionPolicy[] {
    const out: RetentionPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRetentionPolicyStore(): RetentionPolicyStore {
  return new MemoryRetentionPolicyStore(new Map<string, RetentionPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRetentionPolicyStore implements RetentionPolicyStore {
  inner: RetentionPolicyStore;
  cache: cache.TtlCache<RetentionPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: RetentionPolicyStore,
    cacheValue: cache.TtlCache<RetentionPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RetentionPolicy | undefined {
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

  save(item: RetentionPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RetentionPolicy[] {
    return this.inner.list();
  }
}

export function newCachedRetentionPolicyStore(inner: RetentionPolicyStore, ttl: number, clockValue: clock.Clock): RetentionPolicyStore {
  return new CachedRetentionPolicyStore(inner, cache.newTtlCache<RetentionPolicy>(128, ttl, clockValue), 0, 0);
}

/** Selects retention policies. Empty fields match all. */
export class RetentionPolicyQuery {
  name: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minGraceDays: number, statuses: string[], limit: number) {
    this.name = name;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RetentionPolicy): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RetentionPolicy[]): RetentionPolicy[] {
    const matched = collections.filter(items, (candidate: RetentionPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRetentionPolicies(store: RetentionPolicyStore, query: RetentionPolicyQuery): RetentionPolicy[] {
  return query.apply(store.list());
}
