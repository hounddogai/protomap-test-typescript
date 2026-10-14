import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultBidRuleAdjustment } from "./default-bid-rule-adjustment.js";

/** Keeps default bid rule adjustments by code. */
export interface DefaultBidRuleAdjustmentStore {
  find(code: string): DefaultBidRuleAdjustment | undefined;
  save(item: DefaultBidRuleAdjustment): void;
  remove(code: string): boolean;
  list(): DefaultBidRuleAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultBidRuleAdjustmentStore implements DefaultBidRuleAdjustmentStore {
  items: Map<string, DefaultBidRuleAdjustment>;
  order: string[];

  constructor(items: Map<string, DefaultBidRuleAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultBidRuleAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultBidRuleAdjustment): void {
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

  list(): DefaultBidRuleAdjustment[] {
    const out: DefaultBidRuleAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultBidRuleAdjustmentStore(): DefaultBidRuleAdjustmentStore {
  return new MemoryDefaultBidRuleAdjustmentStore(new Map<string, DefaultBidRuleAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultBidRuleAdjustmentStore implements DefaultBidRuleAdjustmentStore {
  inner: DefaultBidRuleAdjustmentStore;
  cache: cache.TtlCache<DefaultBidRuleAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultBidRuleAdjustmentStore,
    cacheValue: cache.TtlCache<DefaultBidRuleAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultBidRuleAdjustment | undefined {
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

  save(item: DefaultBidRuleAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultBidRuleAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedDefaultBidRuleAdjustmentStore(inner: DefaultBidRuleAdjustmentStore, ttl: number, clockValue: clock.Clock): DefaultBidRuleAdjustmentStore {
  return new CachedDefaultBidRuleAdjustmentStore(
    inner,
    cache.newTtlCache<DefaultBidRuleAdjustment>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default bid rule adjustments. Empty fields match all. */
export class DefaultBidRuleAdjustmentQuery {
  name: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.name = name;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultBidRuleAdjustment): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultBidRuleAdjustment[]): DefaultBidRuleAdjustment[] {
    const matched = collections.filter(items, (candidate: DefaultBidRuleAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultBidRuleAdjustments(store: DefaultBidRuleAdjustmentStore, query: DefaultBidRuleAdjustmentQuery): DefaultBidRuleAdjustment[] {
  return query.apply(store.list());
}
