import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TicketViewBundle } from "./ticket-view-bundle.js";

/** Keeps ticket view bundles by code. */
export interface TicketViewBundleStore {
  find(code: string): TicketViewBundle | undefined;
  save(item: TicketViewBundle): void;
  remove(code: string): boolean;
  list(): TicketViewBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTicketViewBundleStore implements TicketViewBundleStore {
  items: Map<string, TicketViewBundle>;
  order: string[];

  constructor(items: Map<string, TicketViewBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TicketViewBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TicketViewBundle): void {
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

  list(): TicketViewBundle[] {
    const out: TicketViewBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTicketViewBundleStore(): TicketViewBundleStore {
  return new MemoryTicketViewBundleStore(new Map<string, TicketViewBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTicketViewBundleStore implements TicketViewBundleStore {
  inner: TicketViewBundleStore;
  cache: cache.TtlCache<TicketViewBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: TicketViewBundleStore,
    cacheValue: cache.TtlCache<TicketViewBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TicketViewBundle | undefined {
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

  save(item: TicketViewBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TicketViewBundle[] {
    return this.inner.list();
  }
}

export function newCachedTicketViewBundleStore(inner: TicketViewBundleStore, ttl: number, clockValue: clock.Clock): TicketViewBundleStore {
  return new CachedTicketViewBundleStore(inner, cache.newTtlCache<TicketViewBundle>(512, ttl, clockValue), 0, 0);
}

/** Selects ticket view bundles. Empty fields match all. */
export class TicketViewBundleQuery {
  unit: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minScore: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TicketViewBundle): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TicketViewBundle[]): TicketViewBundle[] {
    const matched = collections.filter(items, (candidate: TicketViewBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTicketViewBundles(store: TicketViewBundleStore, query: TicketViewBundleQuery): TicketViewBundle[] {
  return query.apply(store.list());
}
