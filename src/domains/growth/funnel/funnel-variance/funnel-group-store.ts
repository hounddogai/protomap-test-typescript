import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FunnelGroup } from "./funnel-group.js";

/** Keeps funnel groups by code. */
export interface FunnelGroupStore {
  find(code: string): FunnelGroup | undefined;
  save(item: FunnelGroup): void;
  remove(code: string): boolean;
  list(): FunnelGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFunnelGroupStore implements FunnelGroupStore {
  items: Map<string, FunnelGroup>;
  order: string[];

  constructor(items: Map<string, FunnelGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FunnelGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FunnelGroup): void {
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

  list(): FunnelGroup[] {
    const out: FunnelGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFunnelGroupStore(): FunnelGroupStore {
  return new MemoryFunnelGroupStore(new Map<string, FunnelGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFunnelGroupStore implements FunnelGroupStore {
  inner: FunnelGroupStore;
  cache: cache.TtlCache<FunnelGroup>;
  hits: number;
  misses: number;

  constructor(inner: FunnelGroupStore, cacheValue: cache.TtlCache<FunnelGroup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FunnelGroup | undefined {
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

  save(item: FunnelGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FunnelGroup[] {
    return this.inner.list();
  }
}

export function newCachedFunnelGroupStore(inner: FunnelGroupStore, ttl: number, clockValue: clock.Clock): FunnelGroupStore {
  return new CachedFunnelGroupStore(inner, cache.newTtlCache<FunnelGroup>(256, ttl, clockValue), 0, 0);
}

/** Selects funnel groups. Empty fields match all. */
export class FunnelGroupQuery {
  title: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minOpenRate: number, statuses: string[], limit: number) {
    this.title = title;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FunnelGroup): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FunnelGroup[]): FunnelGroup[] {
    const matched = collections.filter(items, (candidate: FunnelGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFunnelGroups(store: FunnelGroupStore, query: FunnelGroupQuery): FunnelGroup[] {
  return query.apply(store.list());
}
