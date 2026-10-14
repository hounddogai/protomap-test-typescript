import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BadgeBaseline } from "./badge-baseline.js";

/** Keeps badge baselines by code. */
export interface BadgeBaselineStore {
  find(code: string): BadgeBaseline | undefined;
  save(item: BadgeBaseline): void;
  remove(code: string): boolean;
  list(): BadgeBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBadgeBaselineStore implements BadgeBaselineStore {
  items: Map<string, BadgeBaseline>;
  order: string[];

  constructor(items: Map<string, BadgeBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BadgeBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BadgeBaseline): void {
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

  list(): BadgeBaseline[] {
    const out: BadgeBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBadgeBaselineStore(): BadgeBaselineStore {
  return new MemoryBadgeBaselineStore(new Map<string, BadgeBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBadgeBaselineStore implements BadgeBaselineStore {
  inner: BadgeBaselineStore;
  cache: cache.TtlCache<BadgeBaseline>;
  hits: number;
  misses: number;

  constructor(inner: BadgeBaselineStore, cacheValue: cache.TtlCache<BadgeBaseline>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BadgeBaseline | undefined {
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

  save(item: BadgeBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BadgeBaseline[] {
    return this.inner.list();
  }
}

export function newCachedBadgeBaselineStore(inner: BadgeBaselineStore, ttl: number, clockValue: clock.Clock): BadgeBaselineStore {
  return new CachedBadgeBaselineStore(inner, cache.newTtlCache<BadgeBaseline>(256, ttl, clockValue), 0, 0);
}

/** Selects badge baselines. Empty fields match all. */
export class BadgeBaselineQuery {
  name: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minVersion: number, statuses: string[], limit: number) {
    this.name = name;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BadgeBaseline): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BadgeBaseline[]): BadgeBaseline[] {
    const matched = collections.filter(items, (candidate: BadgeBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBadgeBaselines(store: BadgeBaselineStore, query: BadgeBaselineQuery): BadgeBaseline[] {
  return query.apply(store.list());
}
