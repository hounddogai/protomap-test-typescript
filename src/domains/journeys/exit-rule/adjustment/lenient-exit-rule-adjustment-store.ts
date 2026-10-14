import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientExitRuleAdjustment } from "./lenient-exit-rule-adjustment.js";

/** Keeps lenient exit rule adjustments by code. */
export interface LenientExitRuleAdjustmentStore {
  find(code: string): LenientExitRuleAdjustment | undefined;
  save(item: LenientExitRuleAdjustment): void;
  remove(code: string): boolean;
  list(): LenientExitRuleAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientExitRuleAdjustmentStore implements LenientExitRuleAdjustmentStore {
  items: Map<string, LenientExitRuleAdjustment>;
  order: string[];

  constructor(items: Map<string, LenientExitRuleAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientExitRuleAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientExitRuleAdjustment): void {
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

  list(): LenientExitRuleAdjustment[] {
    const out: LenientExitRuleAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientExitRuleAdjustmentStore(): LenientExitRuleAdjustmentStore {
  return new MemoryLenientExitRuleAdjustmentStore(new Map<string, LenientExitRuleAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientExitRuleAdjustmentStore implements LenientExitRuleAdjustmentStore {
  inner: LenientExitRuleAdjustmentStore;
  cache: cache.TtlCache<LenientExitRuleAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientExitRuleAdjustmentStore,
    cacheValue: cache.TtlCache<LenientExitRuleAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientExitRuleAdjustment | undefined {
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

  save(item: LenientExitRuleAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientExitRuleAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedLenientExitRuleAdjustmentStore(inner: LenientExitRuleAdjustmentStore, ttl: number, clockValue: clock.Clock): LenientExitRuleAdjustmentStore {
  return new CachedLenientExitRuleAdjustmentStore(
    inner,
    cache.newTtlCache<LenientExitRuleAdjustment>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient exit rule adjustments. Empty fields match all. */
export class LenientExitRuleAdjustmentQuery {
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

  matches(item: LenientExitRuleAdjustment): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientExitRuleAdjustment[]): LenientExitRuleAdjustment[] {
    const matched = collections.filter(items, (candidate: LenientExitRuleAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientExitRuleAdjustments(store: LenientExitRuleAdjustmentStore, query: LenientExitRuleAdjustmentQuery): LenientExitRuleAdjustment[] {
  return query.apply(store.list());
}
