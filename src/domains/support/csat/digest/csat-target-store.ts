import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CsatTarget } from "./csat-target.js";

/** Keeps csat targets by code. */
export interface CsatTargetStore {
  find(code: string): CsatTarget | undefined;
  save(item: CsatTarget): void;
  remove(code: string): boolean;
  list(): CsatTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCsatTargetStore implements CsatTargetStore {
  items: Map<string, CsatTarget>;
  order: string[];

  constructor(items: Map<string, CsatTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CsatTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CsatTarget): void {
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

  list(): CsatTarget[] {
    const out: CsatTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCsatTargetStore(): CsatTargetStore {
  return new MemoryCsatTargetStore(new Map<string, CsatTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCsatTargetStore implements CsatTargetStore {
  inner: CsatTargetStore;
  cache: cache.TtlCache<CsatTarget>;
  hits: number;
  misses: number;

  constructor(inner: CsatTargetStore, cacheValue: cache.TtlCache<CsatTarget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CsatTarget | undefined {
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

  save(item: CsatTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CsatTarget[] {
    return this.inner.list();
  }
}

export function newCachedCsatTargetStore(inner: CsatTargetStore, ttl: number, clockValue: clock.Clock): CsatTargetStore {
  return new CachedCsatTargetStore(inner, cache.newTtlCache<CsatTarget>(128, ttl, clockValue), 0, 0);
}

/** Selects csat targets. Empty fields match all. */
export class CsatTargetQuery {
  name: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minMaximum: number, statuses: string[], limit: number) {
    this.name = name;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CsatTarget): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CsatTarget[]): CsatTarget[] {
    const matched = collections.filter(items, (candidate: CsatTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCsatTargets(store: CsatTargetStore, query: CsatTargetQuery): CsatTarget[] {
  return query.apply(store.list());
}
