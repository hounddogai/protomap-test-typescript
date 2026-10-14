import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BadgePolicy } from "./badge-policy.js";

/** Keeps badge policies by code. */
export interface BadgePolicyStore {
  find(code: string): BadgePolicy | undefined;
  save(item: BadgePolicy): void;
  remove(code: string): boolean;
  list(): BadgePolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBadgePolicyStore implements BadgePolicyStore {
  items: Map<string, BadgePolicy>;
  order: string[];

  constructor(items: Map<string, BadgePolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BadgePolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BadgePolicy): void {
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

  list(): BadgePolicy[] {
    const out: BadgePolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBadgePolicyStore(): BadgePolicyStore {
  return new MemoryBadgePolicyStore(new Map<string, BadgePolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBadgePolicyStore implements BadgePolicyStore {
  inner: BadgePolicyStore;
  cache: cache.TtlCache<BadgePolicy>;
  hits: number;
  misses: number;

  constructor(inner: BadgePolicyStore, cacheValue: cache.TtlCache<BadgePolicy>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BadgePolicy | undefined {
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

  save(item: BadgePolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BadgePolicy[] {
    return this.inner.list();
  }
}

export function newCachedBadgePolicyStore(inner: BadgePolicyStore, ttl: number, clockValue: clock.Clock): BadgePolicyStore {
  return new CachedBadgePolicyStore(inner, cache.newTtlCache<BadgePolicy>(1024, ttl, clockValue), 0, 0);
}

/** Selects badge policies. Empty fields match all. */
export class BadgePolicyQuery {
  title: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minBudget: number, statuses: string[], limit: number) {
    this.title = title;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BadgePolicy): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BadgePolicy[]): BadgePolicy[] {
    const matched = collections.filter(items, (candidate: BadgePolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBadgePolicies(store: BadgePolicyStore, query: BadgePolicyQuery): BadgePolicy[] {
  return query.apply(store.list());
}
