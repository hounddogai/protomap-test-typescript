import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingStepPolicy } from "./rolling-step-policy.js";

/** Keeps rolling step policies by code. */
export interface RollingStepPolicyStore {
  find(code: string): RollingStepPolicy | undefined;
  save(item: RollingStepPolicy): void;
  remove(code: string): boolean;
  list(): RollingStepPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingStepPolicyStore implements RollingStepPolicyStore {
  items: Map<string, RollingStepPolicy>;
  order: string[];

  constructor(items: Map<string, RollingStepPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingStepPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingStepPolicy): void {
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

  list(): RollingStepPolicy[] {
    const out: RollingStepPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingStepPolicyStore(): RollingStepPolicyStore {
  return new MemoryRollingStepPolicyStore(new Map<string, RollingStepPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingStepPolicyStore implements RollingStepPolicyStore {
  inner: RollingStepPolicyStore;
  cache: cache.TtlCache<RollingStepPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingStepPolicyStore,
    cacheValue: cache.TtlCache<RollingStepPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingStepPolicy | undefined {
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

  save(item: RollingStepPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingStepPolicy[] {
    return this.inner.list();
  }
}

export function newCachedRollingStepPolicyStore(inner: RollingStepPolicyStore, ttl: number, clockValue: clock.Clock): RollingStepPolicyStore {
  return new CachedRollingStepPolicyStore(inner, cache.newTtlCache<RollingStepPolicy>(512, ttl, clockValue), 0, 0);
}

/** Selects rolling step policies. Empty fields match all. */
export class RollingStepPolicyQuery {
  utmSource: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minGraceDays: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingStepPolicy): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingStepPolicy[]): RollingStepPolicy[] {
    const matched = collections.filter(items, (candidate: RollingStepPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingStepPolicies(store: RollingStepPolicyStore, query: RollingStepPolicyQuery): RollingStepPolicy[] {
  return query.apply(store.list());
}
