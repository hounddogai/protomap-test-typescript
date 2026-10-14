import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MacroQuota } from "./macro-quota.js";

/** Keeps macro quotas by code. */
export interface MacroQuotaStore {
  find(code: string): MacroQuota | undefined;
  save(item: MacroQuota): void;
  remove(code: string): boolean;
  list(): MacroQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMacroQuotaStore implements MacroQuotaStore {
  items: Map<string, MacroQuota>;
  order: string[];

  constructor(items: Map<string, MacroQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MacroQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MacroQuota): void {
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

  list(): MacroQuota[] {
    const out: MacroQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMacroQuotaStore(): MacroQuotaStore {
  return new MemoryMacroQuotaStore(new Map<string, MacroQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMacroQuotaStore implements MacroQuotaStore {
  inner: MacroQuotaStore;
  cache: cache.TtlCache<MacroQuota>;
  hits: number;
  misses: number;

  constructor(inner: MacroQuotaStore, cacheValue: cache.TtlCache<MacroQuota>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MacroQuota | undefined {
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

  save(item: MacroQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MacroQuota[] {
    return this.inner.list();
  }
}

export function newCachedMacroQuotaStore(inner: MacroQuotaStore, ttl: number, clockValue: clock.Clock): MacroQuotaStore {
  return new CachedMacroQuotaStore(inner, cache.newTtlCache<MacroQuota>(128, ttl, clockValue), 0, 0);
}

/** Selects macro quotas. Empty fields match all. */
export class MacroQuotaQuery {
  name: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRetries: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MacroQuota): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MacroQuota[]): MacroQuota[] {
    const matched = collections.filter(items, (candidate: MacroQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMacroQuotas(store: MacroQuotaStore, query: MacroQuotaQuery): MacroQuota[] {
  return query.apply(store.list());
}
