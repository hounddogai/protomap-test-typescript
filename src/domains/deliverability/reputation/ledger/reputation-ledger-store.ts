import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReputationLedger } from "./reputation-ledger.js";

/** Keeps reputation ledgers by code. */
export interface ReputationLedgerStore {
  find(code: string): ReputationLedger | undefined;
  save(item: ReputationLedger): void;
  remove(code: string): boolean;
  list(): ReputationLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReputationLedgerStore implements ReputationLedgerStore {
  items: Map<string, ReputationLedger>;
  order: string[];

  constructor(items: Map<string, ReputationLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReputationLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReputationLedger): void {
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

  list(): ReputationLedger[] {
    const out: ReputationLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReputationLedgerStore(): ReputationLedgerStore {
  return new MemoryReputationLedgerStore(new Map<string, ReputationLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReputationLedgerStore implements ReputationLedgerStore {
  inner: ReputationLedgerStore;
  cache: cache.TtlCache<ReputationLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: ReputationLedgerStore,
    cacheValue: cache.TtlCache<ReputationLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReputationLedger | undefined {
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

  save(item: ReputationLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReputationLedger[] {
    return this.inner.list();
  }
}

export function newCachedReputationLedgerStore(inner: ReputationLedgerStore, ttl: number, clockValue: clock.Clock): ReputationLedgerStore {
  return new CachedReputationLedgerStore(inner, cache.newTtlCache<ReputationLedger>(128, ttl, clockValue), 0, 0);
}

/** Selects reputation ledgers. Empty fields match all. */
export class ReputationLedgerQuery {
  label: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minScore: number, statuses: string[], limit: number) {
    this.label = label;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReputationLedger): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReputationLedger[]): ReputationLedger[] {
    const matched = collections.filter(items, (candidate: ReputationLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReputationLedgers(store: ReputationLedgerStore, query: ReputationLedgerQuery): ReputationLedger[] {
  return query.apply(store.list());
}
