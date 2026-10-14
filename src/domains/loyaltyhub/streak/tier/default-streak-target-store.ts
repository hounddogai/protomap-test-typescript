import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultStreakTarget } from "./default-streak-target.js";

/** Keeps default streak targets by code. */
export interface DefaultStreakTargetStore {
  find(code: string): DefaultStreakTarget | undefined;
  save(item: DefaultStreakTarget): void;
  remove(code: string): boolean;
  list(): DefaultStreakTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultStreakTargetStore implements DefaultStreakTargetStore {
  items: Map<string, DefaultStreakTarget>;
  order: string[];

  constructor(items: Map<string, DefaultStreakTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultStreakTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultStreakTarget): void {
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

  list(): DefaultStreakTarget[] {
    const out: DefaultStreakTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultStreakTargetStore(): DefaultStreakTargetStore {
  return new MemoryDefaultStreakTargetStore(new Map<string, DefaultStreakTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultStreakTargetStore implements DefaultStreakTargetStore {
  inner: DefaultStreakTargetStore;
  cache: cache.TtlCache<DefaultStreakTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultStreakTargetStore,
    cacheValue: cache.TtlCache<DefaultStreakTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultStreakTarget | undefined {
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

  save(item: DefaultStreakTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultStreakTarget[] {
    return this.inner.list();
  }
}

export function newCachedDefaultStreakTargetStore(inner: DefaultStreakTargetStore, ttl: number, clockValue: clock.Clock): DefaultStreakTargetStore {
  return new CachedDefaultStreakTargetStore(inner, cache.newTtlCache<DefaultStreakTarget>(512, ttl, clockValue), 0, 0);
}

/** Selects default streak targets. Empty fields match all. */
export class DefaultStreakTargetQuery {
  utmSource: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultStreakTarget): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultStreakTarget[]): DefaultStreakTarget[] {
    const matched = collections.filter(items, (candidate: DefaultStreakTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultStreakTargets(store: DefaultStreakTargetStore, query: DefaultStreakTargetQuery): DefaultStreakTarget[] {
  return query.apply(store.list());
}
