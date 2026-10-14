import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryPaywallBaseline } from "./primary-paywall-baseline.js";

/** Keeps primary paywall baselines by code. */
export interface PrimaryPaywallBaselineStore {
  find(code: string): PrimaryPaywallBaseline | undefined;
  save(item: PrimaryPaywallBaseline): void;
  remove(code: string): boolean;
  list(): PrimaryPaywallBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryPaywallBaselineStore implements PrimaryPaywallBaselineStore {
  items: Map<string, PrimaryPaywallBaseline>;
  order: string[];

  constructor(items: Map<string, PrimaryPaywallBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryPaywallBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryPaywallBaseline): void {
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

  list(): PrimaryPaywallBaseline[] {
    const out: PrimaryPaywallBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryPaywallBaselineStore(): PrimaryPaywallBaselineStore {
  return new MemoryPrimaryPaywallBaselineStore(new Map<string, PrimaryPaywallBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryPaywallBaselineStore implements PrimaryPaywallBaselineStore {
  inner: PrimaryPaywallBaselineStore;
  cache: cache.TtlCache<PrimaryPaywallBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryPaywallBaselineStore,
    cacheValue: cache.TtlCache<PrimaryPaywallBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryPaywallBaseline | undefined {
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

  save(item: PrimaryPaywallBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryPaywallBaseline[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryPaywallBaselineStore(inner: PrimaryPaywallBaselineStore, ttl: number, clockValue: clock.Clock): PrimaryPaywallBaselineStore {
  return new CachedPrimaryPaywallBaselineStore(
    inner,
    cache.newTtlCache<PrimaryPaywallBaseline>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary paywall baselines. Empty fields match all. */
export class PrimaryPaywallBaselineQuery {
  title: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minPriority: number, statuses: string[], limit: number) {
    this.title = title;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryPaywallBaseline): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryPaywallBaseline[]): PrimaryPaywallBaseline[] {
    const matched = collections.filter(items, (candidate: PrimaryPaywallBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryPaywallBaselines(store: PrimaryPaywallBaselineStore, query: PrimaryPaywallBaselineQuery): PrimaryPaywallBaseline[] {
  return query.apply(store.list());
}
