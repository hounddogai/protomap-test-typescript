import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ModelPolicy } from "./model-policy.js";

/** Keeps model policies by code. */
export interface ModelPolicyStore {
  find(code: string): ModelPolicy | undefined;
  save(item: ModelPolicy): void;
  remove(code: string): boolean;
  list(): ModelPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryModelPolicyStore implements ModelPolicyStore {
  items: Map<string, ModelPolicy>;
  order: string[];

  constructor(items: Map<string, ModelPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ModelPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ModelPolicy): void {
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

  list(): ModelPolicy[] {
    const out: ModelPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryModelPolicyStore(): ModelPolicyStore {
  return new MemoryModelPolicyStore(new Map<string, ModelPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedModelPolicyStore implements ModelPolicyStore {
  inner: ModelPolicyStore;
  cache: cache.TtlCache<ModelPolicy>;
  hits: number;
  misses: number;

  constructor(inner: ModelPolicyStore, cacheValue: cache.TtlCache<ModelPolicy>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ModelPolicy | undefined {
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

  save(item: ModelPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ModelPolicy[] {
    return this.inner.list();
  }
}

export function newCachedModelPolicyStore(inner: ModelPolicyStore, ttl: number, clockValue: clock.Clock): ModelPolicyStore {
  return new CachedModelPolicyStore(inner, cache.newTtlCache<ModelPolicy>(128, ttl, clockValue), 0, 0);
}

/** Selects model policies. Empty fields match all. */
export class ModelPolicyQuery {
  region: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minMargin: number, statuses: string[], limit: number) {
    this.region = region;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ModelPolicy): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ModelPolicy[]): ModelPolicy[] {
    const matched = collections.filter(items, (candidate: ModelPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findModelPolicies(store: ModelPolicyStore, query: ModelPolicyQuery): ModelPolicy[] {
  return query.apply(store.list());
}
