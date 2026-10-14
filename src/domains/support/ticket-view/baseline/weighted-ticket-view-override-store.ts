import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedTicketViewOverride } from "./weighted-ticket-view-override.js";

/** Keeps weighted ticket view overrides by code. */
export interface WeightedTicketViewOverrideStore {
  find(code: string): WeightedTicketViewOverride | undefined;
  save(item: WeightedTicketViewOverride): void;
  remove(code: string): boolean;
  list(): WeightedTicketViewOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedTicketViewOverrideStore implements WeightedTicketViewOverrideStore {
  items: Map<string, WeightedTicketViewOverride>;
  order: string[];

  constructor(items: Map<string, WeightedTicketViewOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedTicketViewOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedTicketViewOverride): void {
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

  list(): WeightedTicketViewOverride[] {
    const out: WeightedTicketViewOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedTicketViewOverrideStore(): WeightedTicketViewOverrideStore {
  return new MemoryWeightedTicketViewOverrideStore(new Map<string, WeightedTicketViewOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedTicketViewOverrideStore implements WeightedTicketViewOverrideStore {
  inner: WeightedTicketViewOverrideStore;
  cache: cache.TtlCache<WeightedTicketViewOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedTicketViewOverrideStore,
    cacheValue: cache.TtlCache<WeightedTicketViewOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedTicketViewOverride | undefined {
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

  save(item: WeightedTicketViewOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedTicketViewOverride[] {
    return this.inner.list();
  }
}

export function newCachedWeightedTicketViewOverrideStore(inner: WeightedTicketViewOverrideStore, ttl: number, clockValue: clock.Clock): WeightedTicketViewOverrideStore {
  return new CachedWeightedTicketViewOverrideStore(
    inner,
    cache.newTtlCache<WeightedTicketViewOverride>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted ticket view overrides. Empty fields match all. */
export class WeightedTicketViewOverrideQuery {
  channel: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minClicks: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedTicketViewOverride): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedTicketViewOverride[]): WeightedTicketViewOverride[] {
    const matched = collections.filter(items, (candidate: WeightedTicketViewOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedTicketViewOverrides(store: WeightedTicketViewOverrideStore, query: WeightedTicketViewOverrideQuery): WeightedTicketViewOverride[] {
  return query.apply(store.list());
}
