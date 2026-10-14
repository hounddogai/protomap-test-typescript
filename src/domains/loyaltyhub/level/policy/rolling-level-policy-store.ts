import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingLevelPolicy } from "./rolling-level-policy.js";

/** Keeps rolling level policies by code. */
export interface RollingLevelPolicyStore {
  find(code: string): RollingLevelPolicy | undefined;
  save(item: RollingLevelPolicy): void;
  remove(code: string): boolean;
  list(): RollingLevelPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingLevelPolicyStore implements RollingLevelPolicyStore {
  items: Map<string, RollingLevelPolicy>;
  order: string[];

  constructor(items: Map<string, RollingLevelPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingLevelPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingLevelPolicy): void {
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

  list(): RollingLevelPolicy[] {
    const out: RollingLevelPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingLevelPolicyStore(): RollingLevelPolicyStore {
  return new MemoryRollingLevelPolicyStore(new Map<string, RollingLevelPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingLevelPolicyStore implements RollingLevelPolicyStore {
  inner: RollingLevelPolicyStore;
  cache: cache.TtlCache<RollingLevelPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingLevelPolicyStore,
    cacheValue: cache.TtlCache<RollingLevelPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingLevelPolicy | undefined {
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

  save(item: RollingLevelPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingLevelPolicy[] {
    return this.inner.list();
  }
}

export function newCachedRollingLevelPolicyStore(inner: RollingLevelPolicyStore, ttl: number, clockValue: clock.Clock): RollingLevelPolicyStore {
  return new CachedRollingLevelPolicyStore(inner, cache.newTtlCache<RollingLevelPolicy>(64, ttl, clockValue), 0, 0);
}

/** Selects rolling level policies. Empty fields match all. */
export class RollingLevelPolicyQuery {
  name: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.name = name;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingLevelPolicy): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingLevelPolicy[]): RollingLevelPolicy[] {
    const matched = collections.filter(items, (candidate: RollingLevelPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingLevelPolicies(store: RollingLevelPolicyStore, query: RollingLevelPolicyQuery): RollingLevelPolicy[] {
  return query.apply(store.list());
}
