import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalMentionLedger } from "./seasonal-mention-ledger.js";

/** Keeps seasonal mention ledgers by code. */
export interface SeasonalMentionLedgerStore {
  find(code: string): SeasonalMentionLedger | undefined;
  save(item: SeasonalMentionLedger): void;
  remove(code: string): boolean;
  list(): SeasonalMentionLedger[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalMentionLedgerStore implements SeasonalMentionLedgerStore {
  items: Map<string, SeasonalMentionLedger>;
  order: string[];

  constructor(items: Map<string, SeasonalMentionLedger>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalMentionLedger | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalMentionLedger): void {
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

  list(): SeasonalMentionLedger[] {
    const out: SeasonalMentionLedger[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalMentionLedgerStore(): SeasonalMentionLedgerStore {
  return new MemorySeasonalMentionLedgerStore(new Map<string, SeasonalMentionLedger>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalMentionLedgerStore implements SeasonalMentionLedgerStore {
  inner: SeasonalMentionLedgerStore;
  cache: cache.TtlCache<SeasonalMentionLedger>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalMentionLedgerStore,
    cacheValue: cache.TtlCache<SeasonalMentionLedger>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalMentionLedger | undefined {
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

  save(item: SeasonalMentionLedger): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalMentionLedger[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalMentionLedgerStore(inner: SeasonalMentionLedgerStore, ttl: number, clockValue: clock.Clock): SeasonalMentionLedgerStore {
  return new CachedSeasonalMentionLedgerStore(
    inner,
    cache.newTtlCache<SeasonalMentionLedger>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal mention ledgers. Empty fields match all. */
export class SeasonalMentionLedgerQuery {
  segment: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minImpressions: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalMentionLedger): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalMentionLedger[]): SeasonalMentionLedger[] {
    const matched = collections.filter(items, (candidate: SeasonalMentionLedger): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalMentionLedgers(store: SeasonalMentionLedgerStore, query: SeasonalMentionLedgerQuery): SeasonalMentionLedger[] {
  return query.apply(store.list());
}
