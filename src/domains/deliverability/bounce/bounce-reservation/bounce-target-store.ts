import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BounceTarget } from "./bounce-target.js";

/** Keeps bounce targets by code. */
export interface BounceTargetStore {
  find(code: string): BounceTarget | undefined;
  save(item: BounceTarget): void;
  remove(code: string): boolean;
  list(): BounceTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBounceTargetStore implements BounceTargetStore {
  items: Map<string, BounceTarget>;
  order: string[];

  constructor(items: Map<string, BounceTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BounceTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BounceTarget): void {
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

  list(): BounceTarget[] {
    const out: BounceTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBounceTargetStore(): BounceTargetStore {
  return new MemoryBounceTargetStore(new Map<string, BounceTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBounceTargetStore implements BounceTargetStore {
  inner: BounceTargetStore;
  cache: cache.TtlCache<BounceTarget>;
  hits: number;
  misses: number;

  constructor(inner: BounceTargetStore, cacheValue: cache.TtlCache<BounceTarget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BounceTarget | undefined {
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

  save(item: BounceTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BounceTarget[] {
    return this.inner.list();
  }
}

export function newCachedBounceTargetStore(inner: BounceTargetStore, ttl: number, clockValue: clock.Clock): BounceTargetStore {
  return new CachedBounceTargetStore(inner, cache.newTtlCache<BounceTarget>(1024, ttl, clockValue), 0, 0);
}

/** Selects bounce targets. Empty fields match all. */
export class BounceTargetQuery {
  label: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minQuantity: number, statuses: string[], limit: number) {
    this.label = label;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BounceTarget): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BounceTarget[]): BounceTarget[] {
    const matched = collections.filter(items, (candidate: BounceTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBounceTargets(store: BounceTargetStore, query: BounceTargetQuery): BounceTarget[] {
  return query.apply(store.list());
}
