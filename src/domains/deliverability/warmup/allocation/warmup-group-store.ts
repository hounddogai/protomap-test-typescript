import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WarmupGroup } from "./warmup-group.js";

/** Keeps warmup groups by code. */
export interface WarmupGroupStore {
  find(code: string): WarmupGroup | undefined;
  save(item: WarmupGroup): void;
  remove(code: string): boolean;
  list(): WarmupGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWarmupGroupStore implements WarmupGroupStore {
  items: Map<string, WarmupGroup>;
  order: string[];

  constructor(items: Map<string, WarmupGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WarmupGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WarmupGroup): void {
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

  list(): WarmupGroup[] {
    const out: WarmupGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWarmupGroupStore(): WarmupGroupStore {
  return new MemoryWarmupGroupStore(new Map<string, WarmupGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWarmupGroupStore implements WarmupGroupStore {
  inner: WarmupGroupStore;
  cache: cache.TtlCache<WarmupGroup>;
  hits: number;
  misses: number;

  constructor(inner: WarmupGroupStore, cacheValue: cache.TtlCache<WarmupGroup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WarmupGroup | undefined {
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

  save(item: WarmupGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WarmupGroup[] {
    return this.inner.list();
  }
}

export function newCachedWarmupGroupStore(inner: WarmupGroupStore, ttl: number, clockValue: clock.Clock): WarmupGroupStore {
  return new CachedWarmupGroupStore(inner, cache.newTtlCache<WarmupGroup>(128, ttl, clockValue), 0, 0);
}

/** Selects warmup groups. Empty fields match all. */
export class WarmupGroupQuery {
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

  matches(item: WarmupGroup): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WarmupGroup[]): WarmupGroup[] {
    const matched = collections.filter(items, (candidate: WarmupGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWarmupGroups(store: WarmupGroupStore, query: WarmupGroupQuery): WarmupGroup[] {
  return query.apply(store.list());
}
