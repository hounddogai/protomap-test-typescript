import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ActivationTarget } from "./activation-target.js";

/** Keeps activation targets by code. */
export interface ActivationTargetStore {
  find(code: string): ActivationTarget | undefined;
  save(item: ActivationTarget): void;
  remove(code: string): boolean;
  list(): ActivationTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryActivationTargetStore implements ActivationTargetStore {
  items: Map<string, ActivationTarget>;
  order: string[];

  constructor(items: Map<string, ActivationTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ActivationTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ActivationTarget): void {
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

  list(): ActivationTarget[] {
    const out: ActivationTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryActivationTargetStore(): ActivationTargetStore {
  return new MemoryActivationTargetStore(new Map<string, ActivationTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedActivationTargetStore implements ActivationTargetStore {
  inner: ActivationTargetStore;
  cache: cache.TtlCache<ActivationTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: ActivationTargetStore,
    cacheValue: cache.TtlCache<ActivationTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ActivationTarget | undefined {
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

  save(item: ActivationTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ActivationTarget[] {
    return this.inner.list();
  }
}

export function newCachedActivationTargetStore(inner: ActivationTargetStore, ttl: number, clockValue: clock.Clock): ActivationTargetStore {
  return new CachedActivationTargetStore(inner, cache.newTtlCache<ActivationTarget>(512, ttl, clockValue), 0, 0);
}

/** Selects activation targets. Empty fields match all. */
export class ActivationTargetQuery {
  name: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCapacity: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ActivationTarget): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ActivationTarget[]): ActivationTarget[] {
    const matched = collections.filter(items, (candidate: ActivationTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findActivationTargets(store: ActivationTargetStore, query: ActivationTargetQuery): ActivationTarget[] {
  return query.apply(store.list());
}
