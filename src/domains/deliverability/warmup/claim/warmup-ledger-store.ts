import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WarmupLedger } from "./warmup-ledger.js";

/** Keeps warmup ledgers by code. */
export interface WarmupLedgerStore {
  find(code: string): WarmupLedger | undefined;
  save(item: WarmupLedger): void;
  remove(code: string): boolean;
  list(): WarmupLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWarmupLedgerStore implements WarmupLedgerStore {
  items: Map<string, WarmupLedger>;
  order: string[];

  constructor(items: Map<string, WarmupLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WarmupLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WarmupLedger): void {
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

  list(): WarmupLedger[] {
    const out: WarmupLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWarmupLedgerStore(): WarmupLedgerStore {
  return new MemoryWarmupLedgerStore(new Map<string, WarmupLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWarmupLedgerStore implements WarmupLedgerStore {
  inner: WarmupLedgerStore;
  cache: cache.TtlCache<WarmupLedger>;
  hits: number;
  misses: number;

  constructor(inner: WarmupLedgerStore, cacheValue: cache.TtlCache<WarmupLedger>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WarmupLedger | undefined {
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

  save(item: WarmupLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WarmupLedger[] {
    return this.inner.list();
  }
}

export function newCachedWarmupLedgerStore(inner: WarmupLedgerStore, ttl: number, clockValue: clock.Clock): WarmupLedgerStore {
  return new CachedWarmupLedgerStore(inner, cache.newTtlCache<WarmupLedger>(128, ttl, clockValue), 0, 0);
}

/** Selects warmup ledgers. Empty fields match all. */
export class WarmupLedgerQuery {
  channel: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minImpressions: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WarmupLedger): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WarmupLedger[]): WarmupLedger[] {
    const matched = collections.filter(items, (candidate: WarmupLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWarmupLedgers(store: WarmupLedgerStore, query: WarmupLedgerQuery): WarmupLedger[] {
  return query.apply(store.list());
}
