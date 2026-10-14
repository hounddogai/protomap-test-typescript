import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictLevelTarget } from "./strict-level-target.js";

/** Keeps strict level targets by code. */
export interface StrictLevelTargetStore {
  find(code: string): StrictLevelTarget | undefined;
  save(item: StrictLevelTarget): void;
  remove(code: string): boolean;
  list(): StrictLevelTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictLevelTargetStore implements StrictLevelTargetStore {
  items: Map<string, StrictLevelTarget>;
  order: string[];

  constructor(items: Map<string, StrictLevelTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictLevelTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictLevelTarget): void {
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

  list(): StrictLevelTarget[] {
    const out: StrictLevelTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictLevelTargetStore(): StrictLevelTargetStore {
  return new MemoryStrictLevelTargetStore(new Map<string, StrictLevelTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictLevelTargetStore implements StrictLevelTargetStore {
  inner: StrictLevelTargetStore;
  cache: cache.TtlCache<StrictLevelTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictLevelTargetStore,
    cacheValue: cache.TtlCache<StrictLevelTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictLevelTarget | undefined {
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

  save(item: StrictLevelTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictLevelTarget[] {
    return this.inner.list();
  }
}

export function newCachedStrictLevelTargetStore(inner: StrictLevelTargetStore, ttl: number, clockValue: clock.Clock): StrictLevelTargetStore {
  return new CachedStrictLevelTargetStore(inner, cache.newTtlCache<StrictLevelTarget>(64, ttl, clockValue), 0, 0);
}

/** Selects strict level targets. Empty fields match all. */
export class StrictLevelTargetQuery {
  title: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minThreshold: number, statuses: string[], limit: number) {
    this.title = title;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictLevelTarget): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictLevelTarget[]): StrictLevelTarget[] {
    const matched = collections.filter(items, (candidate: StrictLevelTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictLevelTargets(store: StrictLevelTargetStore, query: StrictLevelTargetQuery): StrictLevelTarget[] {
  return query.apply(store.list());
}
