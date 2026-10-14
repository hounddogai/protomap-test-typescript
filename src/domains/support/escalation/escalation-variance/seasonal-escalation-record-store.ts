import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalEscalationRecord } from "./seasonal-escalation-record.js";

/** Keeps seasonal escalation records by code. */
export interface SeasonalEscalationRecordStore {
  find(code: string): SeasonalEscalationRecord | undefined;
  save(item: SeasonalEscalationRecord): void;
  remove(code: string): boolean;
  list(): SeasonalEscalationRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalEscalationRecordStore implements SeasonalEscalationRecordStore {
  items: Map<string, SeasonalEscalationRecord>;
  order: string[];

  constructor(items: Map<string, SeasonalEscalationRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalEscalationRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalEscalationRecord): void {
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

  list(): SeasonalEscalationRecord[] {
    const out: SeasonalEscalationRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalEscalationRecordStore(): SeasonalEscalationRecordStore {
  return new MemorySeasonalEscalationRecordStore(new Map<string, SeasonalEscalationRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalEscalationRecordStore implements SeasonalEscalationRecordStore {
  inner: SeasonalEscalationRecordStore;
  cache: cache.TtlCache<SeasonalEscalationRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalEscalationRecordStore,
    cacheValue: cache.TtlCache<SeasonalEscalationRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalEscalationRecord | undefined {
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

  save(item: SeasonalEscalationRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalEscalationRecord[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalEscalationRecordStore(inner: SeasonalEscalationRecordStore, ttl: number, clockValue: clock.Clock): SeasonalEscalationRecordStore {
  return new CachedSeasonalEscalationRecordStore(
    inner,
    cache.newTtlCache<SeasonalEscalationRecord>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal escalation records. Empty fields match all. */
export class SeasonalEscalationRecordQuery {
  locale: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minConversionRate: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalEscalationRecord): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalEscalationRecord[]): SeasonalEscalationRecord[] {
    const matched = collections.filter(items, (candidate: SeasonalEscalationRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalEscalationRecords(store: SeasonalEscalationRecordStore, query: SeasonalEscalationRecordQuery): SeasonalEscalationRecord[] {
  return query.apply(store.list());
}
