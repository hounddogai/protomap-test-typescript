import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReputationWindow } from "./reputation-window.js";

/** Keeps reputation windows by code. */
export interface ReputationWindowStore {
  find(code: string): ReputationWindow | undefined;
  save(item: ReputationWindow): void;
  remove(code: string): boolean;
  list(): ReputationWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReputationWindowStore implements ReputationWindowStore {
  items: Map<string, ReputationWindow>;
  order: string[];

  constructor(items: Map<string, ReputationWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReputationWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReputationWindow): void {
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

  list(): ReputationWindow[] {
    const out: ReputationWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReputationWindowStore(): ReputationWindowStore {
  return new MemoryReputationWindowStore(new Map<string, ReputationWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReputationWindowStore implements ReputationWindowStore {
  inner: ReputationWindowStore;
  cache: cache.TtlCache<ReputationWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: ReputationWindowStore,
    cacheValue: cache.TtlCache<ReputationWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReputationWindow | undefined {
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

  save(item: ReputationWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReputationWindow[] {
    return this.inner.list();
  }
}

export function newCachedReputationWindowStore(inner: ReputationWindowStore, ttl: number, clockValue: clock.Clock): ReputationWindowStore {
  return new CachedReputationWindowStore(inner, cache.newTtlCache<ReputationWindow>(64, ttl, clockValue), 0, 0);
}

/** Selects reputation windows. Empty fields match all. */
export class ReputationWindowQuery {
  utmSource: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minClicks: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReputationWindow): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReputationWindow[]): ReputationWindow[] {
    const matched = collections.filter(items, (candidate: ReputationWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReputationWindows(store: ReputationWindowStore, query: ReputationWindowQuery): ReputationWindow[] {
  return query.apply(store.list());
}
