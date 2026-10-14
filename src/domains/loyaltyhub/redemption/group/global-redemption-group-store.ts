import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalRedemptionGroup } from "./global-redemption-group.js";

/** Keeps global redemption groups by code. */
export interface GlobalRedemptionGroupStore {
  find(code: string): GlobalRedemptionGroup | undefined;
  save(item: GlobalRedemptionGroup): void;
  remove(code: string): boolean;
  list(): GlobalRedemptionGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalRedemptionGroupStore implements GlobalRedemptionGroupStore {
  items: Map<string, GlobalRedemptionGroup>;
  order: string[];

  constructor(items: Map<string, GlobalRedemptionGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalRedemptionGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalRedemptionGroup): void {
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

  list(): GlobalRedemptionGroup[] {
    const out: GlobalRedemptionGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalRedemptionGroupStore(): GlobalRedemptionGroupStore {
  return new MemoryGlobalRedemptionGroupStore(new Map<string, GlobalRedemptionGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalRedemptionGroupStore implements GlobalRedemptionGroupStore {
  inner: GlobalRedemptionGroupStore;
  cache: cache.TtlCache<GlobalRedemptionGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalRedemptionGroupStore,
    cacheValue: cache.TtlCache<GlobalRedemptionGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalRedemptionGroup | undefined {
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

  save(item: GlobalRedemptionGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalRedemptionGroup[] {
    return this.inner.list();
  }
}

export function newCachedGlobalRedemptionGroupStore(inner: GlobalRedemptionGroupStore, ttl: number, clockValue: clock.Clock): GlobalRedemptionGroupStore {
  return new CachedGlobalRedemptionGroupStore(
    inner,
    cache.newTtlCache<GlobalRedemptionGroup>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global redemption groups. Empty fields match all. */
export class GlobalRedemptionGroupQuery {
  channel: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minSendAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalRedemptionGroup): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalRedemptionGroup[]): GlobalRedemptionGroup[] {
    const matched = collections.filter(items, (candidate: GlobalRedemptionGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalRedemptionGroups(store: GlobalRedemptionGroupStore, query: GlobalRedemptionGroupQuery): GlobalRedemptionGroup[] {
  return query.apply(store.list());
}
