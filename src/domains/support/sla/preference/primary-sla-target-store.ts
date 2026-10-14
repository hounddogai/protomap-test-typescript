import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimarySlaTarget } from "./primary-sla-target.js";

/** Keeps primary sla targets by code. */
export interface PrimarySlaTargetStore {
  find(code: string): PrimarySlaTarget | undefined;
  save(item: PrimarySlaTarget): void;
  remove(code: string): boolean;
  list(): PrimarySlaTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimarySlaTargetStore implements PrimarySlaTargetStore {
  items: Map<string, PrimarySlaTarget>;
  order: string[];

  constructor(items: Map<string, PrimarySlaTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimarySlaTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimarySlaTarget): void {
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

  list(): PrimarySlaTarget[] {
    const out: PrimarySlaTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimarySlaTargetStore(): PrimarySlaTargetStore {
  return new MemoryPrimarySlaTargetStore(new Map<string, PrimarySlaTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimarySlaTargetStore implements PrimarySlaTargetStore {
  inner: PrimarySlaTargetStore;
  cache: cache.TtlCache<PrimarySlaTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimarySlaTargetStore,
    cacheValue: cache.TtlCache<PrimarySlaTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimarySlaTarget | undefined {
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

  save(item: PrimarySlaTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimarySlaTarget[] {
    return this.inner.list();
  }
}

export function newCachedPrimarySlaTargetStore(inner: PrimarySlaTargetStore, ttl: number, clockValue: clock.Clock): PrimarySlaTargetStore {
  return new CachedPrimarySlaTargetStore(inner, cache.newTtlCache<PrimarySlaTarget>(128, ttl, clockValue), 0, 0);
}

/** Selects primary sla targets. Empty fields match all. */
export class PrimarySlaTargetQuery {
  title: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.title = title;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimarySlaTarget): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimarySlaTarget[]): PrimarySlaTarget[] {
    const matched = collections.filter(items, (candidate: PrimarySlaTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimarySlaTargets(store: PrimarySlaTargetStore, query: PrimarySlaTargetQuery): PrimarySlaTarget[] {
  return query.apply(store.list());
}
