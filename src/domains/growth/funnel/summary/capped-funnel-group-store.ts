import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedFunnelGroup } from "./capped-funnel-group.js";

/** Keeps capped funnel groups by code. */
export interface CappedFunnelGroupStore {
  find(code: string): CappedFunnelGroup | undefined;
  save(item: CappedFunnelGroup): void;
  remove(code: string): boolean;
  list(): CappedFunnelGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedFunnelGroupStore implements CappedFunnelGroupStore {
  items: Map<string, CappedFunnelGroup>;
  order: string[];

  constructor(items: Map<string, CappedFunnelGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedFunnelGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedFunnelGroup): void {
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

  list(): CappedFunnelGroup[] {
    const out: CappedFunnelGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedFunnelGroupStore(): CappedFunnelGroupStore {
  return new MemoryCappedFunnelGroupStore(new Map<string, CappedFunnelGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedFunnelGroupStore implements CappedFunnelGroupStore {
  inner: CappedFunnelGroupStore;
  cache: cache.TtlCache<CappedFunnelGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedFunnelGroupStore,
    cacheValue: cache.TtlCache<CappedFunnelGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedFunnelGroup | undefined {
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

  save(item: CappedFunnelGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedFunnelGroup[] {
    return this.inner.list();
  }
}

export function newCachedCappedFunnelGroupStore(inner: CappedFunnelGroupStore, ttl: number, clockValue: clock.Clock): CappedFunnelGroupStore {
  return new CachedCappedFunnelGroupStore(inner, cache.newTtlCache<CappedFunnelGroup>(64, ttl, clockValue), 0, 0);
}

/** Selects capped funnel groups. Empty fields match all. */
export class CappedFunnelGroupQuery {
  utmSource: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minWeight: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedFunnelGroup): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedFunnelGroup[]): CappedFunnelGroup[] {
    const matched = collections.filter(items, (candidate: CappedFunnelGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedFunnelGroups(store: CappedFunnelGroupStore, query: CappedFunnelGroupQuery): CappedFunnelGroup[] {
  return query.apply(store.list());
}
