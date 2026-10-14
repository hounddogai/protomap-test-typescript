import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PacingBaseline } from "./pacing-baseline.js";

/** Keeps pacing baselines by code. */
export interface PacingBaselineStore {
  find(code: string): PacingBaseline | undefined;
  save(item: PacingBaseline): void;
  remove(code: string): boolean;
  list(): PacingBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPacingBaselineStore implements PacingBaselineStore {
  items: Map<string, PacingBaseline>;
  order: string[];

  constructor(items: Map<string, PacingBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PacingBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PacingBaseline): void {
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

  list(): PacingBaseline[] {
    const out: PacingBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPacingBaselineStore(): PacingBaselineStore {
  return new MemoryPacingBaselineStore(new Map<string, PacingBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPacingBaselineStore implements PacingBaselineStore {
  inner: PacingBaselineStore;
  cache: cache.TtlCache<PacingBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: PacingBaselineStore,
    cacheValue: cache.TtlCache<PacingBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PacingBaseline | undefined {
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

  save(item: PacingBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PacingBaseline[] {
    return this.inner.list();
  }
}

export function newCachedPacingBaselineStore(inner: PacingBaselineStore, ttl: number, clockValue: clock.Clock): PacingBaselineStore {
  return new CachedPacingBaselineStore(inner, cache.newTtlCache<PacingBaseline>(256, ttl, clockValue), 0, 0);
}

/** Selects pacing baselines. Empty fields match all. */
export class PacingBaselineQuery {
  title: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PacingBaseline): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PacingBaseline[]): PacingBaseline[] {
    const matched = collections.filter(items, (candidate: PacingBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPacingBaselines(store: PacingBaselineStore, query: PacingBaselineQuery): PacingBaseline[] {
  return query.apply(store.list());
}
