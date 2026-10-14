import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingWindowTarget } from "./rolling-window-target.js";

/** Keeps rolling window targets by code. */
export interface RollingWindowTargetStore {
  find(code: string): RollingWindowTarget | undefined;
  save(item: RollingWindowTarget): void;
  remove(code: string): boolean;
  list(): RollingWindowTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingWindowTargetStore implements RollingWindowTargetStore {
  items: Map<string, RollingWindowTarget>;
  order: string[];

  constructor(items: Map<string, RollingWindowTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingWindowTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingWindowTarget): void {
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

  list(): RollingWindowTarget[] {
    const out: RollingWindowTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingWindowTargetStore(): RollingWindowTargetStore {
  return new MemoryRollingWindowTargetStore(new Map<string, RollingWindowTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingWindowTargetStore implements RollingWindowTargetStore {
  inner: RollingWindowTargetStore;
  cache: cache.TtlCache<RollingWindowTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingWindowTargetStore,
    cacheValue: cache.TtlCache<RollingWindowTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingWindowTarget | undefined {
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

  save(item: RollingWindowTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingWindowTarget[] {
    return this.inner.list();
  }
}

export function newCachedRollingWindowTargetStore(inner: RollingWindowTargetStore, ttl: number, clockValue: clock.Clock): RollingWindowTargetStore {
  return new CachedRollingWindowTargetStore(inner, cache.newTtlCache<RollingWindowTarget>(1024, ttl, clockValue), 0, 0);
}

/** Selects rolling window targets. Empty fields match all. */
export class RollingWindowTargetQuery {
  title: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minWeight: number, statuses: string[], limit: number) {
    this.title = title;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingWindowTarget): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingWindowTarget[]): RollingWindowTarget[] {
    const matched = collections.filter(items, (candidate: RollingWindowTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingWindowTargets(store: RollingWindowTargetStore, query: RollingWindowTargetQuery): RollingWindowTarget[] {
  return query.apply(store.list());
}
