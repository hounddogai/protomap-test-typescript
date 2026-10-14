import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingWarmupRule } from "./pending-warmup-rule.js";

/** Keeps pending warmup rules by code. */
export interface PendingWarmupRuleStore {
  find(code: string): PendingWarmupRule | undefined;
  save(item: PendingWarmupRule): void;
  remove(code: string): boolean;
  list(): PendingWarmupRule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingWarmupRuleStore implements PendingWarmupRuleStore {
  items: Map<string, PendingWarmupRule>;
  order: string[];

  constructor(items: Map<string, PendingWarmupRule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingWarmupRule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingWarmupRule): void {
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

  list(): PendingWarmupRule[] {
    const out: PendingWarmupRule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingWarmupRuleStore(): PendingWarmupRuleStore {
  return new MemoryPendingWarmupRuleStore(new Map<string, PendingWarmupRule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingWarmupRuleStore implements PendingWarmupRuleStore {
  inner: PendingWarmupRuleStore;
  cache: cache.TtlCache<PendingWarmupRule>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingWarmupRuleStore,
    cacheValue: cache.TtlCache<PendingWarmupRule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingWarmupRule | undefined {
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

  save(item: PendingWarmupRule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingWarmupRule[] {
    return this.inner.list();
  }
}

export function newCachedPendingWarmupRuleStore(inner: PendingWarmupRuleStore, ttl: number, clockValue: clock.Clock): PendingWarmupRuleStore {
  return new CachedPendingWarmupRuleStore(inner, cache.newTtlCache<PendingWarmupRule>(64, ttl, clockValue), 0, 0);
}

/** Selects pending warmup rules. Empty fields match all. */
export class PendingWarmupRuleQuery {
  channel: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCeiling: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingWarmupRule): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingWarmupRule[]): PendingWarmupRule[] {
    const matched = collections.filter(items, (candidate: PendingWarmupRule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingWarmupRules(store: PendingWarmupRuleStore, query: PendingWarmupRuleQuery): PendingWarmupRule[] {
  return query.apply(store.list());
}
