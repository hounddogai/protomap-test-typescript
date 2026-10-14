import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyDoubleOptInLedger } from "./legacy-double-opt-in-ledger.js";

/** Keeps legacy double opt in ledgers by code. */
export interface LegacyDoubleOptInLedgerStore {
  find(code: string): LegacyDoubleOptInLedger | undefined;
  save(item: LegacyDoubleOptInLedger): void;
  remove(code: string): boolean;
  list(): LegacyDoubleOptInLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyDoubleOptInLedgerStore implements LegacyDoubleOptInLedgerStore {
  items: Map<string, LegacyDoubleOptInLedger>;
  order: string[];

  constructor(items: Map<string, LegacyDoubleOptInLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyDoubleOptInLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyDoubleOptInLedger): void {
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

  list(): LegacyDoubleOptInLedger[] {
    const out: LegacyDoubleOptInLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyDoubleOptInLedgerStore(): LegacyDoubleOptInLedgerStore {
  return new MemoryLegacyDoubleOptInLedgerStore(new Map<string, LegacyDoubleOptInLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyDoubleOptInLedgerStore implements LegacyDoubleOptInLedgerStore {
  inner: LegacyDoubleOptInLedgerStore;
  cache: cache.TtlCache<LegacyDoubleOptInLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyDoubleOptInLedgerStore,
    cacheValue: cache.TtlCache<LegacyDoubleOptInLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyDoubleOptInLedger | undefined {
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

  save(item: LegacyDoubleOptInLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyDoubleOptInLedger[] {
    return this.inner.list();
  }
}

export function newCachedLegacyDoubleOptInLedgerStore(inner: LegacyDoubleOptInLedgerStore, ttl: number, clockValue: clock.Clock): LegacyDoubleOptInLedgerStore {
  return new CachedLegacyDoubleOptInLedgerStore(
    inner,
    cache.newTtlCache<LegacyDoubleOptInLedger>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy double opt in ledgers. Empty fields match all. */
export class LegacyDoubleOptInLedgerQuery {
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

  matches(item: LegacyDoubleOptInLedger): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyDoubleOptInLedger[]): LegacyDoubleOptInLedger[] {
    const matched = collections.filter(items, (candidate: LegacyDoubleOptInLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyDoubleOptInLedgers(store: LegacyDoubleOptInLedgerStore, query: LegacyDoubleOptInLedgerQuery): LegacyDoubleOptInLedger[] {
  return query.apply(store.list());
}
