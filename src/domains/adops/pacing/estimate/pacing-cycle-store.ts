import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PacingCycle } from "./pacing-cycle.js";

/** Keeps pacing cycles by code. */
export interface PacingCycleStore {
  find(code: string): PacingCycle | undefined;
  save(item: PacingCycle): void;
  remove(code: string): boolean;
  list(): PacingCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPacingCycleStore implements PacingCycleStore {
  items: Map<string, PacingCycle>;
  order: string[];

  constructor(items: Map<string, PacingCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PacingCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PacingCycle): void {
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

  list(): PacingCycle[] {
    const out: PacingCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPacingCycleStore(): PacingCycleStore {
  return new MemoryPacingCycleStore(new Map<string, PacingCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPacingCycleStore implements PacingCycleStore {
  inner: PacingCycleStore;
  cache: cache.TtlCache<PacingCycle>;
  hits: number;
  misses: number;

  constructor(inner: PacingCycleStore, cacheValue: cache.TtlCache<PacingCycle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PacingCycle | undefined {
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

  save(item: PacingCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PacingCycle[] {
    return this.inner.list();
  }
}

export function newCachedPacingCycleStore(inner: PacingCycleStore, ttl: number, clockValue: clock.Clock): PacingCycleStore {
  return new CachedPacingCycleStore(inner, cache.newTtlCache<PacingCycle>(256, ttl, clockValue), 0, 0);
}

/** Selects pacing cycles. Empty fields match all. */
export class PacingCycleQuery {
  locale: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRevision: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PacingCycle): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PacingCycle[]): PacingCycle[] {
    const matched = collections.filter(items, (candidate: PacingCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPacingCycles(store: PacingCycleStore, query: PacingCycleQuery): PacingCycle[] {
  return query.apply(store.list());
}
