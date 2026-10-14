import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PathTarget } from "./path-target.js";

/** Keeps path targets by code. */
export interface PathTargetStore {
  find(code: string): PathTarget | undefined;
  save(item: PathTarget): void;
  remove(code: string): boolean;
  list(): PathTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPathTargetStore implements PathTargetStore {
  items: Map<string, PathTarget>;
  order: string[];

  constructor(items: Map<string, PathTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PathTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PathTarget): void {
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

  list(): PathTarget[] {
    const out: PathTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPathTargetStore(): PathTargetStore {
  return new MemoryPathTargetStore(new Map<string, PathTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPathTargetStore implements PathTargetStore {
  inner: PathTargetStore;
  cache: cache.TtlCache<PathTarget>;
  hits: number;
  misses: number;

  constructor(inner: PathTargetStore, cacheValue: cache.TtlCache<PathTarget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PathTarget | undefined {
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

  save(item: PathTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PathTarget[] {
    return this.inner.list();
  }
}

export function newCachedPathTargetStore(inner: PathTargetStore, ttl: number, clockValue: clock.Clock): PathTargetStore {
  return new CachedPathTargetStore(inner, cache.newTtlCache<PathTarget>(512, ttl, clockValue), 0, 0);
}

/** Selects path targets. Empty fields match all. */
export class PathTargetQuery {
  channel: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minQuantity: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PathTarget): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PathTarget[]): PathTarget[] {
    const matched = collections.filter(items, (candidate: PathTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPathTargets(store: PathTargetStore, query: PathTargetQuery): PathTarget[] {
  return query.apply(store.list());
}
