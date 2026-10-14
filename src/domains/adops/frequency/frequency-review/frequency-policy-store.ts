import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FrequencyPolicy } from "./frequency-policy.js";

/** Keeps frequency policies by code. */
export interface FrequencyPolicyStore {
  find(code: string): FrequencyPolicy | undefined;
  save(item: FrequencyPolicy): void;
  remove(code: string): boolean;
  list(): FrequencyPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFrequencyPolicyStore implements FrequencyPolicyStore {
  items: Map<string, FrequencyPolicy>;
  order: string[];

  constructor(items: Map<string, FrequencyPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FrequencyPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FrequencyPolicy): void {
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

  list(): FrequencyPolicy[] {
    const out: FrequencyPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFrequencyPolicyStore(): FrequencyPolicyStore {
  return new MemoryFrequencyPolicyStore(new Map<string, FrequencyPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFrequencyPolicyStore implements FrequencyPolicyStore {
  inner: FrequencyPolicyStore;
  cache: cache.TtlCache<FrequencyPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: FrequencyPolicyStore,
    cacheValue: cache.TtlCache<FrequencyPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FrequencyPolicy | undefined {
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

  save(item: FrequencyPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FrequencyPolicy[] {
    return this.inner.list();
  }
}

export function newCachedFrequencyPolicyStore(inner: FrequencyPolicyStore, ttl: number, clockValue: clock.Clock): FrequencyPolicyStore {
  return new CachedFrequencyPolicyStore(inner, cache.newTtlCache<FrequencyPolicy>(512, ttl, clockValue), 0, 0);
}

/** Selects frequency policies. Empty fields match all. */
export class FrequencyPolicyQuery {
  title: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minStartsAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FrequencyPolicy): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FrequencyPolicy[]): FrequencyPolicy[] {
    const matched = collections.filter(items, (candidate: FrequencyPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFrequencyPolicies(store: FrequencyPolicyStore, query: FrequencyPolicyQuery): FrequencyPolicy[] {
  return query.apply(store.list());
}
