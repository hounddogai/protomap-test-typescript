import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PacingTarget } from "./pacing-target.js";

/** Keeps pacing targets by code. */
export interface PacingTargetStore {
  find(code: string): PacingTarget | undefined;
  save(item: PacingTarget): void;
  remove(code: string): boolean;
  list(): PacingTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPacingTargetStore implements PacingTargetStore {
  items: Map<string, PacingTarget>;
  order: string[];

  constructor(items: Map<string, PacingTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PacingTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PacingTarget): void {
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

  list(): PacingTarget[] {
    const out: PacingTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPacingTargetStore(): PacingTargetStore {
  return new MemoryPacingTargetStore(new Map<string, PacingTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPacingTargetStore implements PacingTargetStore {
  inner: PacingTargetStore;
  cache: cache.TtlCache<PacingTarget>;
  hits: number;
  misses: number;

  constructor(inner: PacingTargetStore, cacheValue: cache.TtlCache<PacingTarget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PacingTarget | undefined {
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

  save(item: PacingTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PacingTarget[] {
    return this.inner.list();
  }
}

export function newCachedPacingTargetStore(inner: PacingTargetStore, ttl: number, clockValue: clock.Clock): PacingTargetStore {
  return new CachedPacingTargetStore(inner, cache.newTtlCache<PacingTarget>(1024, ttl, clockValue), 0, 0);
}

/** Selects pacing targets. Empty fields match all. */
export class PacingTargetQuery {
  title: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minConversionRate: number, statuses: string[], limit: number) {
    this.title = title;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PacingTarget): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PacingTarget[]): PacingTarget[] {
    const matched = collections.filter(items, (candidate: PacingTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPacingTargets(store: PacingTargetStore, query: PacingTargetQuery): PacingTarget[] {
  return query.apply(store.list());
}
