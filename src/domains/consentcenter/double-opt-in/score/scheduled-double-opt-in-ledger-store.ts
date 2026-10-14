import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledDoubleOptInLedger } from "./scheduled-double-opt-in-ledger.js";

/** Keeps scheduled double opt in ledgers by code. */
export interface ScheduledDoubleOptInLedgerStore {
  find(code: string): ScheduledDoubleOptInLedger | undefined;
  save(item: ScheduledDoubleOptInLedger): void;
  remove(code: string): boolean;
  list(): ScheduledDoubleOptInLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledDoubleOptInLedgerStore implements ScheduledDoubleOptInLedgerStore {
  items: Map<string, ScheduledDoubleOptInLedger>;
  order: string[];

  constructor(items: Map<string, ScheduledDoubleOptInLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledDoubleOptInLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledDoubleOptInLedger): void {
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

  list(): ScheduledDoubleOptInLedger[] {
    const out: ScheduledDoubleOptInLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledDoubleOptInLedgerStore(): ScheduledDoubleOptInLedgerStore {
  return new MemoryScheduledDoubleOptInLedgerStore(new Map<string, ScheduledDoubleOptInLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledDoubleOptInLedgerStore implements ScheduledDoubleOptInLedgerStore {
  inner: ScheduledDoubleOptInLedgerStore;
  cache: cache.TtlCache<ScheduledDoubleOptInLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledDoubleOptInLedgerStore,
    cacheValue: cache.TtlCache<ScheduledDoubleOptInLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledDoubleOptInLedger | undefined {
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

  save(item: ScheduledDoubleOptInLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledDoubleOptInLedger[] {
    return this.inner.list();
  }
}

export function newCachedScheduledDoubleOptInLedgerStore(inner: ScheduledDoubleOptInLedgerStore, ttl: number, clockValue: clock.Clock): ScheduledDoubleOptInLedgerStore {
  return new CachedScheduledDoubleOptInLedgerStore(
    inner,
    cache.newTtlCache<ScheduledDoubleOptInLedger>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled double opt in ledgers. Empty fields match all. */
export class ScheduledDoubleOptInLedgerQuery {
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

  matches(item: ScheduledDoubleOptInLedger): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledDoubleOptInLedger[]): ScheduledDoubleOptInLedger[] {
    const matched = collections.filter(items, (candidate: ScheduledDoubleOptInLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledDoubleOptInLedgers(store: ScheduledDoubleOptInLedgerStore, query: ScheduledDoubleOptInLedgerQuery): ScheduledDoubleOptInLedger[] {
  return query.apply(store.list());
}
