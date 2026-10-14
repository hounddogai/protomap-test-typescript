import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyEscalationLedger } from "./legacy-escalation-ledger.js";

/** Keeps legacy escalation ledgers by code. */
export interface LegacyEscalationLedgerStore {
  find(code: string): LegacyEscalationLedger | undefined;
  save(item: LegacyEscalationLedger): void;
  remove(code: string): boolean;
  list(): LegacyEscalationLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyEscalationLedgerStore implements LegacyEscalationLedgerStore {
  items: Map<string, LegacyEscalationLedger>;
  order: string[];

  constructor(items: Map<string, LegacyEscalationLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyEscalationLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyEscalationLedger): void {
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

  list(): LegacyEscalationLedger[] {
    const out: LegacyEscalationLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyEscalationLedgerStore(): LegacyEscalationLedgerStore {
  return new MemoryLegacyEscalationLedgerStore(new Map<string, LegacyEscalationLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyEscalationLedgerStore implements LegacyEscalationLedgerStore {
  inner: LegacyEscalationLedgerStore;
  cache: cache.TtlCache<LegacyEscalationLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyEscalationLedgerStore,
    cacheValue: cache.TtlCache<LegacyEscalationLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyEscalationLedger | undefined {
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

  save(item: LegacyEscalationLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyEscalationLedger[] {
    return this.inner.list();
  }
}

export function newCachedLegacyEscalationLedgerStore(inner: LegacyEscalationLedgerStore, ttl: number, clockValue: clock.Clock): LegacyEscalationLedgerStore {
  return new CachedLegacyEscalationLedgerStore(
    inner,
    cache.newTtlCache<LegacyEscalationLedger>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy escalation ledgers. Empty fields match all. */
export class LegacyEscalationLedgerQuery {
  source: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minRatio: number, statuses: string[], limit: number) {
    this.source = source;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyEscalationLedger): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyEscalationLedger[]): LegacyEscalationLedger[] {
    const matched = collections.filter(items, (candidate: LegacyEscalationLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyEscalationLedgers(store: LegacyEscalationLedgerStore, query: LegacyEscalationLedgerQuery): LegacyEscalationLedger[] {
  return query.apply(store.list());
}
