import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientBidRuleBaseline } from "./lenient-bid-rule-baseline.js";

/** Keeps lenient bid rule baselines by code. */
export interface LenientBidRuleBaselineStore {
  find(code: string): LenientBidRuleBaseline | undefined;
  save(item: LenientBidRuleBaseline): void;
  remove(code: string): boolean;
  list(): LenientBidRuleBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientBidRuleBaselineStore implements LenientBidRuleBaselineStore {
  items: Map<string, LenientBidRuleBaseline>;
  order: string[];

  constructor(items: Map<string, LenientBidRuleBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientBidRuleBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientBidRuleBaseline): void {
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

  list(): LenientBidRuleBaseline[] {
    const out: LenientBidRuleBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientBidRuleBaselineStore(): LenientBidRuleBaselineStore {
  return new MemoryLenientBidRuleBaselineStore(new Map<string, LenientBidRuleBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientBidRuleBaselineStore implements LenientBidRuleBaselineStore {
  inner: LenientBidRuleBaselineStore;
  cache: cache.TtlCache<LenientBidRuleBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientBidRuleBaselineStore,
    cacheValue: cache.TtlCache<LenientBidRuleBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientBidRuleBaseline | undefined {
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

  save(item: LenientBidRuleBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientBidRuleBaseline[] {
    return this.inner.list();
  }
}

export function newCachedLenientBidRuleBaselineStore(inner: LenientBidRuleBaselineStore, ttl: number, clockValue: clock.Clock): LenientBidRuleBaselineStore {
  return new CachedLenientBidRuleBaselineStore(
    inner,
    cache.newTtlCache<LenientBidRuleBaseline>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient bid rule baselines. Empty fields match all. */
export class LenientBidRuleBaselineQuery {
  title: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minStartsAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientBidRuleBaseline): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientBidRuleBaseline[]): LenientBidRuleBaseline[] {
    const matched = collections.filter(items, (candidate: LenientBidRuleBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientBidRuleBaselines(store: LenientBidRuleBaselineStore, query: LenientBidRuleBaselineQuery): LenientBidRuleBaseline[] {
  return query.apply(store.list());
}
