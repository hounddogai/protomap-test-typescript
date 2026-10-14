import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LevelPolicy } from "./level-policy.js";

/** Keeps level policies by code. */
export interface LevelPolicyStore {
  find(code: string): LevelPolicy | undefined;
  save(item: LevelPolicy): void;
  remove(code: string): boolean;
  list(): LevelPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLevelPolicyStore implements LevelPolicyStore {
  items: Map<string, LevelPolicy>;
  order: string[];

  constructor(items: Map<string, LevelPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LevelPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LevelPolicy): void {
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

  list(): LevelPolicy[] {
    const out: LevelPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLevelPolicyStore(): LevelPolicyStore {
  return new MemoryLevelPolicyStore(new Map<string, LevelPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLevelPolicyStore implements LevelPolicyStore {
  inner: LevelPolicyStore;
  cache: cache.TtlCache<LevelPolicy>;
  hits: number;
  misses: number;

  constructor(inner: LevelPolicyStore, cacheValue: cache.TtlCache<LevelPolicy>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LevelPolicy | undefined {
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

  save(item: LevelPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LevelPolicy[] {
    return this.inner.list();
  }
}

export function newCachedLevelPolicyStore(inner: LevelPolicyStore, ttl: number, clockValue: clock.Clock): LevelPolicyStore {
  return new CachedLevelPolicyStore(inner, cache.newTtlCache<LevelPolicy>(1024, ttl, clockValue), 0, 0);
}

/** Selects level policies. Empty fields match all. */
export class LevelPolicyQuery {
  name: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minLimit: number, statuses: string[], limit: number) {
    this.name = name;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LevelPolicy): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LevelPolicy[]): LevelPolicy[] {
    const matched = collections.filter(items, (candidate: LevelPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLevelPolicies(store: LevelPolicyStore, query: LevelPolicyQuery): LevelPolicy[] {
  return query.apply(store.list());
}
