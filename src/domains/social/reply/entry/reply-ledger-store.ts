import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReplyLedger } from "./reply-ledger.js";

/** Keeps reply ledgers by code. */
export interface ReplyLedgerStore {
  find(code: string): ReplyLedger | undefined;
  save(item: ReplyLedger): void;
  remove(code: string): boolean;
  list(): ReplyLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReplyLedgerStore implements ReplyLedgerStore {
  items: Map<string, ReplyLedger>;
  order: string[];

  constructor(items: Map<string, ReplyLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReplyLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReplyLedger): void {
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

  list(): ReplyLedger[] {
    const out: ReplyLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReplyLedgerStore(): ReplyLedgerStore {
  return new MemoryReplyLedgerStore(new Map<string, ReplyLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReplyLedgerStore implements ReplyLedgerStore {
  inner: ReplyLedgerStore;
  cache: cache.TtlCache<ReplyLedger>;
  hits: number;
  misses: number;

  constructor(inner: ReplyLedgerStore, cacheValue: cache.TtlCache<ReplyLedger>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReplyLedger | undefined {
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

  save(item: ReplyLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReplyLedger[] {
    return this.inner.list();
  }
}

export function newCachedReplyLedgerStore(inner: ReplyLedgerStore, ttl: number, clockValue: clock.Clock): ReplyLedgerStore {
  return new CachedReplyLedgerStore(inner, cache.newTtlCache<ReplyLedger>(256, ttl, clockValue), 0, 0);
}

/** Selects reply ledgers. Empty fields match all. */
export class ReplyLedgerQuery {
  country: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minFloorValue: number, statuses: string[], limit: number) {
    this.country = country;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReplyLedger): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReplyLedger[]): ReplyLedger[] {
    const matched = collections.filter(items, (candidate: ReplyLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReplyLedgers(store: ReplyLedgerStore, query: ReplyLedgerQuery): ReplyLedger[] {
  return query.apply(store.list());
}
