import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PathPolicy } from "./path-policy.js";

/** Keeps path policies by code. */
export interface PathPolicyStore {
  find(code: string): PathPolicy | undefined;
  save(item: PathPolicy): void;
  remove(code: string): boolean;
  list(): PathPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPathPolicyStore implements PathPolicyStore {
  items: Map<string, PathPolicy>;
  order: string[];

  constructor(items: Map<string, PathPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PathPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PathPolicy): void {
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

  list(): PathPolicy[] {
    const out: PathPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPathPolicyStore(): PathPolicyStore {
  return new MemoryPathPolicyStore(new Map<string, PathPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPathPolicyStore implements PathPolicyStore {
  inner: PathPolicyStore;
  cache: cache.TtlCache<PathPolicy>;
  hits: number;
  misses: number;

  constructor(inner: PathPolicyStore, cacheValue: cache.TtlCache<PathPolicy>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PathPolicy | undefined {
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

  save(item: PathPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PathPolicy[] {
    return this.inner.list();
  }
}

export function newCachedPathPolicyStore(inner: PathPolicyStore, ttl: number, clockValue: clock.Clock): PathPolicyStore {
  return new CachedPathPolicyStore(inner, cache.newTtlCache<PathPolicy>(64, ttl, clockValue), 0, 0);
}

/** Selects path policies. Empty fields match all. */
export class PathPolicyQuery {
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

  matches(item: PathPolicy): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PathPolicy[]): PathPolicy[] {
    const matched = collections.filter(items, (candidate: PathPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPathPolicies(store: PathPolicyStore, query: PathPolicyQuery): PathPolicy[] {
  return query.apply(store.list());
}
