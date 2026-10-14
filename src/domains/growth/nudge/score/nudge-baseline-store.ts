import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { NudgeBaseline } from "./nudge-baseline.js";

/** Keeps nudge baselines by code. */
export interface NudgeBaselineStore {
  find(code: string): NudgeBaseline | undefined;
  save(item: NudgeBaseline): void;
  remove(code: string): boolean;
  list(): NudgeBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryNudgeBaselineStore implements NudgeBaselineStore {
  items: Map<string, NudgeBaseline>;
  order: string[];

  constructor(items: Map<string, NudgeBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): NudgeBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: NudgeBaseline): void {
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

  list(): NudgeBaseline[] {
    const out: NudgeBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryNudgeBaselineStore(): NudgeBaselineStore {
  return new MemoryNudgeBaselineStore(new Map<string, NudgeBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedNudgeBaselineStore implements NudgeBaselineStore {
  inner: NudgeBaselineStore;
  cache: cache.TtlCache<NudgeBaseline>;
  hits: number;
  misses: number;

  constructor(inner: NudgeBaselineStore, cacheValue: cache.TtlCache<NudgeBaseline>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): NudgeBaseline | undefined {
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

  save(item: NudgeBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): NudgeBaseline[] {
    return this.inner.list();
  }
}

export function newCachedNudgeBaselineStore(inner: NudgeBaselineStore, ttl: number, clockValue: clock.Clock): NudgeBaselineStore {
  return new CachedNudgeBaselineStore(inner, cache.newTtlCache<NudgeBaseline>(512, ttl, clockValue), 0, 0);
}

/** Selects nudge baselines. Empty fields match all. */
export class NudgeBaselineQuery {
  region: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minAmount: number, statuses: string[], limit: number) {
    this.region = region;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: NudgeBaseline): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: NudgeBaseline[]): NudgeBaseline[] {
    const matched = collections.filter(items, (candidate: NudgeBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findNudgeBaselines(store: NudgeBaselineStore, query: NudgeBaselineQuery): NudgeBaseline[] {
  return query.apply(store.list());
}
