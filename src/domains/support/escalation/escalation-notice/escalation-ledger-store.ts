import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EscalationLedger } from "./escalation-ledger.js";

/** Keeps escalation ledgers by code. */
export interface EscalationLedgerStore {
  find(code: string): EscalationLedger | undefined;
  save(item: EscalationLedger): void;
  remove(code: string): boolean;
  list(): EscalationLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEscalationLedgerStore implements EscalationLedgerStore {
  items: Map<string, EscalationLedger>;
  order: string[];

  constructor(items: Map<string, EscalationLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EscalationLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EscalationLedger): void {
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

  list(): EscalationLedger[] {
    const out: EscalationLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEscalationLedgerStore(): EscalationLedgerStore {
  return new MemoryEscalationLedgerStore(new Map<string, EscalationLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEscalationLedgerStore implements EscalationLedgerStore {
  inner: EscalationLedgerStore;
  cache: cache.TtlCache<EscalationLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: EscalationLedgerStore,
    cacheValue: cache.TtlCache<EscalationLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EscalationLedger | undefined {
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

  save(item: EscalationLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EscalationLedger[] {
    return this.inner.list();
  }
}

export function newCachedEscalationLedgerStore(inner: EscalationLedgerStore, ttl: number, clockValue: clock.Clock): EscalationLedgerStore {
  return new CachedEscalationLedgerStore(inner, cache.newTtlCache<EscalationLedger>(1024, ttl, clockValue), 0, 0);
}

/** Selects escalation ledgers. Empty fields match all. */
export class EscalationLedgerQuery {
  name: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minOpenRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EscalationLedger): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EscalationLedger[]): EscalationLedger[] {
    const matched = collections.filter(items, (candidate: EscalationLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEscalationLedgers(store: EscalationLedgerStore, query: EscalationLedgerQuery): EscalationLedger[] {
  return query.apply(store.list());
}
