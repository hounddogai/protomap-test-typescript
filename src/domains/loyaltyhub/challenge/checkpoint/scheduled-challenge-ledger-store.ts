import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledChallengeLedger } from "./scheduled-challenge-ledger.js";

/** Keeps scheduled challenge ledgers by code. */
export interface ScheduledChallengeLedgerStore {
  find(code: string): ScheduledChallengeLedger | undefined;
  save(item: ScheduledChallengeLedger): void;
  remove(code: string): boolean;
  list(): ScheduledChallengeLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledChallengeLedgerStore implements ScheduledChallengeLedgerStore {
  items: Map<string, ScheduledChallengeLedger>;
  order: string[];

  constructor(items: Map<string, ScheduledChallengeLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledChallengeLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledChallengeLedger): void {
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

  list(): ScheduledChallengeLedger[] {
    const out: ScheduledChallengeLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledChallengeLedgerStore(): ScheduledChallengeLedgerStore {
  return new MemoryScheduledChallengeLedgerStore(new Map<string, ScheduledChallengeLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledChallengeLedgerStore implements ScheduledChallengeLedgerStore {
  inner: ScheduledChallengeLedgerStore;
  cache: cache.TtlCache<ScheduledChallengeLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledChallengeLedgerStore,
    cacheValue: cache.TtlCache<ScheduledChallengeLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledChallengeLedger | undefined {
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

  save(item: ScheduledChallengeLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledChallengeLedger[] {
    return this.inner.list();
  }
}

export function newCachedScheduledChallengeLedgerStore(inner: ScheduledChallengeLedgerStore, ttl: number, clockValue: clock.Clock): ScheduledChallengeLedgerStore {
  return new CachedScheduledChallengeLedgerStore(
    inner,
    cache.newTtlCache<ScheduledChallengeLedger>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled challenge ledgers. Empty fields match all. */
export class ScheduledChallengeLedgerQuery {
  country: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minRevision: number, statuses: string[], limit: number) {
    this.country = country;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledChallengeLedger): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledChallengeLedger[]): ScheduledChallengeLedger[] {
    const matched = collections.filter(items, (candidate: ScheduledChallengeLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledChallengeLedgers(store: ScheduledChallengeLedgerStore, query: ScheduledChallengeLedgerQuery): ScheduledChallengeLedger[] {
  return query.apply(store.list());
}
