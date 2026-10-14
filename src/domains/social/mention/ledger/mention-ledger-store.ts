import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MentionLedger } from "./mention-ledger.js";

/** Keeps mention ledgers by code. */
export interface MentionLedgerStore {
  find(code: string): MentionLedger | undefined;
  save(item: MentionLedger): void;
  remove(code: string): boolean;
  list(): MentionLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMentionLedgerStore implements MentionLedgerStore {
  items: Map<string, MentionLedger>;
  order: string[];

  constructor(items: Map<string, MentionLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MentionLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MentionLedger): void {
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

  list(): MentionLedger[] {
    const out: MentionLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMentionLedgerStore(): MentionLedgerStore {
  return new MemoryMentionLedgerStore(new Map<string, MentionLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMentionLedgerStore implements MentionLedgerStore {
  inner: MentionLedgerStore;
  cache: cache.TtlCache<MentionLedger>;
  hits: number;
  misses: number;

  constructor(inner: MentionLedgerStore, cacheValue: cache.TtlCache<MentionLedger>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MentionLedger | undefined {
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

  save(item: MentionLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MentionLedger[] {
    return this.inner.list();
  }
}

export function newCachedMentionLedgerStore(inner: MentionLedgerStore, ttl: number, clockValue: clock.Clock): MentionLedgerStore {
  return new CachedMentionLedgerStore(inner, cache.newTtlCache<MentionLedger>(128, ttl, clockValue), 0, 0);
}

/** Selects mention ledgers. Empty fields match all. */
export class MentionLedgerQuery {
  utmSource: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minCeiling: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MentionLedger): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MentionLedger[]): MentionLedger[] {
    const matched = collections.filter(items, (candidate: MentionLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMentionLedgers(store: MentionLedgerStore, query: MentionLedgerQuery): MentionLedger[] {
  return query.apply(store.list());
}
