import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultWaitTarget } from "./default-wait-target.js";

/** Keeps default wait targets by code. */
export interface DefaultWaitTargetStore {
  find(code: string): DefaultWaitTarget | undefined;
  save(item: DefaultWaitTarget): void;
  remove(code: string): boolean;
  list(): DefaultWaitTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultWaitTargetStore implements DefaultWaitTargetStore {
  items: Map<string, DefaultWaitTarget>;
  order: string[];

  constructor(items: Map<string, DefaultWaitTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultWaitTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultWaitTarget): void {
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

  list(): DefaultWaitTarget[] {
    const out: DefaultWaitTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultWaitTargetStore(): DefaultWaitTargetStore {
  return new MemoryDefaultWaitTargetStore(new Map<string, DefaultWaitTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultWaitTargetStore implements DefaultWaitTargetStore {
  inner: DefaultWaitTargetStore;
  cache: cache.TtlCache<DefaultWaitTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultWaitTargetStore,
    cacheValue: cache.TtlCache<DefaultWaitTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultWaitTarget | undefined {
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

  save(item: DefaultWaitTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultWaitTarget[] {
    return this.inner.list();
  }
}

export function newCachedDefaultWaitTargetStore(inner: DefaultWaitTargetStore, ttl: number, clockValue: clock.Clock): DefaultWaitTargetStore {
  return new CachedDefaultWaitTargetStore(inner, cache.newTtlCache<DefaultWaitTarget>(256, ttl, clockValue), 0, 0);
}

/** Selects default wait targets. Empty fields match all. */
export class DefaultWaitTargetQuery {
  country: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minQuantity: number, statuses: string[], limit: number) {
    this.country = country;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultWaitTarget): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultWaitTarget[]): DefaultWaitTarget[] {
    const matched = collections.filter(items, (candidate: DefaultWaitTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultWaitTargets(store: DefaultWaitTargetStore, query: DefaultWaitTargetQuery): DefaultWaitTarget[] {
  return query.apply(store.list());
}
