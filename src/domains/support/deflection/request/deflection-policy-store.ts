import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DeflectionPolicy } from "./deflection-policy.js";

/** Keeps deflection policies by code. */
export interface DeflectionPolicyStore {
  find(code: string): DeflectionPolicy | undefined;
  save(item: DeflectionPolicy): void;
  remove(code: string): boolean;
  list(): DeflectionPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDeflectionPolicyStore implements DeflectionPolicyStore {
  items: Map<string, DeflectionPolicy>;
  order: string[];

  constructor(items: Map<string, DeflectionPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DeflectionPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DeflectionPolicy): void {
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

  list(): DeflectionPolicy[] {
    const out: DeflectionPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDeflectionPolicyStore(): DeflectionPolicyStore {
  return new MemoryDeflectionPolicyStore(new Map<string, DeflectionPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDeflectionPolicyStore implements DeflectionPolicyStore {
  inner: DeflectionPolicyStore;
  cache: cache.TtlCache<DeflectionPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: DeflectionPolicyStore,
    cacheValue: cache.TtlCache<DeflectionPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DeflectionPolicy | undefined {
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

  save(item: DeflectionPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DeflectionPolicy[] {
    return this.inner.list();
  }
}

export function newCachedDeflectionPolicyStore(inner: DeflectionPolicyStore, ttl: number, clockValue: clock.Clock): DeflectionPolicyStore {
  return new CachedDeflectionPolicyStore(inner, cache.newTtlCache<DeflectionPolicy>(256, ttl, clockValue), 0, 0);
}

/** Selects deflection policies. Empty fields match all. */
export class DeflectionPolicyQuery {
  name: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DeflectionPolicy): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DeflectionPolicy[]): DeflectionPolicy[] {
    const matched = collections.filter(items, (candidate: DeflectionPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDeflectionPolicies(store: DeflectionPolicyStore, query: DeflectionPolicyQuery): DeflectionPolicy[] {
  return query.apply(store.list());
}
