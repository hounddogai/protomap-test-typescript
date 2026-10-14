import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { JourneyPolicy } from "./journey-policy.js";

/** Keeps journey policies by code. */
export interface JourneyPolicyStore {
  find(code: string): JourneyPolicy | undefined;
  save(item: JourneyPolicy): void;
  remove(code: string): boolean;
  list(): JourneyPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryJourneyPolicyStore implements JourneyPolicyStore {
  items: Map<string, JourneyPolicy>;
  order: string[];

  constructor(items: Map<string, JourneyPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): JourneyPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: JourneyPolicy): void {
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

  list(): JourneyPolicy[] {
    const out: JourneyPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryJourneyPolicyStore(): JourneyPolicyStore {
  return new MemoryJourneyPolicyStore(new Map<string, JourneyPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedJourneyPolicyStore implements JourneyPolicyStore {
  inner: JourneyPolicyStore;
  cache: cache.TtlCache<JourneyPolicy>;
  hits: number;
  misses: number;

  constructor(inner: JourneyPolicyStore, cacheValue: cache.TtlCache<JourneyPolicy>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): JourneyPolicy | undefined {
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

  save(item: JourneyPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): JourneyPolicy[] {
    return this.inner.list();
  }
}

export function newCachedJourneyPolicyStore(inner: JourneyPolicyStore, ttl: number, clockValue: clock.Clock): JourneyPolicyStore {
  return new CachedJourneyPolicyStore(inner, cache.newTtlCache<JourneyPolicy>(64, ttl, clockValue), 0, 0);
}

/** Selects journey policies. Empty fields match all. */
export class JourneyPolicyQuery {
  name: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: JourneyPolicy): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: JourneyPolicy[]): JourneyPolicy[] {
    const matched = collections.filter(items, (candidate: JourneyPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findJourneyPolicies(store: JourneyPolicyStore, query: JourneyPolicyQuery): JourneyPolicy[] {
  return query.apply(store.list());
}
