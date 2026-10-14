import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RedemptionOverride } from "./redemption-override.js";

/** Keeps redemption overrides by code. */
export interface RedemptionOverrideStore {
  find(code: string): RedemptionOverride | undefined;
  save(item: RedemptionOverride): void;
  remove(code: string): boolean;
  list(): RedemptionOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRedemptionOverrideStore implements RedemptionOverrideStore {
  items: Map<string, RedemptionOverride>;
  order: string[];

  constructor(items: Map<string, RedemptionOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RedemptionOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RedemptionOverride): void {
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

  list(): RedemptionOverride[] {
    const out: RedemptionOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRedemptionOverrideStore(): RedemptionOverrideStore {
  return new MemoryRedemptionOverrideStore(new Map<string, RedemptionOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRedemptionOverrideStore implements RedemptionOverrideStore {
  inner: RedemptionOverrideStore;
  cache: cache.TtlCache<RedemptionOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: RedemptionOverrideStore,
    cacheValue: cache.TtlCache<RedemptionOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RedemptionOverride | undefined {
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

  save(item: RedemptionOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RedemptionOverride[] {
    return this.inner.list();
  }
}

export function newCachedRedemptionOverrideStore(inner: RedemptionOverrideStore, ttl: number, clockValue: clock.Clock): RedemptionOverrideStore {
  return new CachedRedemptionOverrideStore(inner, cache.newTtlCache<RedemptionOverride>(1024, ttl, clockValue), 0, 0);
}

/** Selects redemption overrides. Empty fields match all. */
export class RedemptionOverrideQuery {
  label: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minSendAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RedemptionOverride): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RedemptionOverride[]): RedemptionOverride[] {
    const matched = collections.filter(items, (candidate: RedemptionOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRedemptionOverrides(store: RedemptionOverrideStore, query: RedemptionOverrideQuery): RedemptionOverride[] {
  return query.apply(store.list());
}
