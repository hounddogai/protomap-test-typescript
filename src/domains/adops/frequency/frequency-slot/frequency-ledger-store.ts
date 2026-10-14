import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FrequencyLedger } from "./frequency-ledger.js";

/** Keeps frequency ledgers by code. */
export interface FrequencyLedgerStore {
  find(code: string): FrequencyLedger | undefined;
  save(item: FrequencyLedger): void;
  remove(code: string): boolean;
  list(): FrequencyLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFrequencyLedgerStore implements FrequencyLedgerStore {
  items: Map<string, FrequencyLedger>;
  order: string[];

  constructor(items: Map<string, FrequencyLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FrequencyLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FrequencyLedger): void {
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

  list(): FrequencyLedger[] {
    const out: FrequencyLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFrequencyLedgerStore(): FrequencyLedgerStore {
  return new MemoryFrequencyLedgerStore(new Map<string, FrequencyLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFrequencyLedgerStore implements FrequencyLedgerStore {
  inner: FrequencyLedgerStore;
  cache: cache.TtlCache<FrequencyLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: FrequencyLedgerStore,
    cacheValue: cache.TtlCache<FrequencyLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FrequencyLedger | undefined {
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

  save(item: FrequencyLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FrequencyLedger[] {
    return this.inner.list();
  }
}

export function newCachedFrequencyLedgerStore(inner: FrequencyLedgerStore, ttl: number, clockValue: clock.Clock): FrequencyLedgerStore {
  return new CachedFrequencyLedgerStore(inner, cache.newTtlCache<FrequencyLedger>(1024, ttl, clockValue), 0, 0);
}

/** Selects frequency ledgers. Empty fields match all. */
export class FrequencyLedgerQuery {
  channel: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minMaximum: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FrequencyLedger): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FrequencyLedger[]): FrequencyLedger[] {
    const matched = collections.filter(items, (candidate: FrequencyLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFrequencyLedgers(store: FrequencyLedgerStore, query: FrequencyLedgerQuery): FrequencyLedger[] {
  return query.apply(store.list());
}
