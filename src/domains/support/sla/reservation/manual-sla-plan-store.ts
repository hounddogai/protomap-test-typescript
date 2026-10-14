import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualSlaPlan } from "./manual-sla-plan.js";

/** Keeps manual sla plans by code. */
export interface ManualSlaPlanStore {
  find(code: string): ManualSlaPlan | undefined;
  save(item: ManualSlaPlan): void;
  remove(code: string): boolean;
  list(): ManualSlaPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualSlaPlanStore implements ManualSlaPlanStore {
  items: Map<string, ManualSlaPlan>;
  order: string[];

  constructor(items: Map<string, ManualSlaPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualSlaPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualSlaPlan): void {
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

  list(): ManualSlaPlan[] {
    const out: ManualSlaPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualSlaPlanStore(): ManualSlaPlanStore {
  return new MemoryManualSlaPlanStore(new Map<string, ManualSlaPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualSlaPlanStore implements ManualSlaPlanStore {
  inner: ManualSlaPlanStore;
  cache: cache.TtlCache<ManualSlaPlan>;
  hits: number;
  misses: number;

  constructor(inner: ManualSlaPlanStore, cacheValue: cache.TtlCache<ManualSlaPlan>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualSlaPlan | undefined {
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

  save(item: ManualSlaPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualSlaPlan[] {
    return this.inner.list();
  }
}

export function newCachedManualSlaPlanStore(inner: ManualSlaPlanStore, ttl: number, clockValue: clock.Clock): ManualSlaPlanStore {
  return new CachedManualSlaPlanStore(inner, cache.newTtlCache<ManualSlaPlan>(256, ttl, clockValue), 0, 0);
}

/** Selects manual sla plans. Empty fields match all. */
export class ManualSlaPlanQuery {
  channel: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualSlaPlan): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualSlaPlan[]): ManualSlaPlan[] {
    const matched = collections.filter(items, (candidate: ManualSlaPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualSlaPlans(store: ManualSlaPlanStore, query: ManualSlaPlanQuery): ManualSlaPlan[] {
  return query.apply(store.list());
}
