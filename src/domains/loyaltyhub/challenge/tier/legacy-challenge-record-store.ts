import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyChallengeRecord } from "./legacy-challenge-record.js";

/** Keeps legacy challenge records by code. */
export interface LegacyChallengeRecordStore {
  find(code: string): LegacyChallengeRecord | undefined;
  save(item: LegacyChallengeRecord): void;
  remove(code: string): boolean;
  list(): LegacyChallengeRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyChallengeRecordStore implements LegacyChallengeRecordStore {
  items: Map<string, LegacyChallengeRecord>;
  order: string[];

  constructor(items: Map<string, LegacyChallengeRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyChallengeRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyChallengeRecord): void {
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

  list(): LegacyChallengeRecord[] {
    const out: LegacyChallengeRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyChallengeRecordStore(): LegacyChallengeRecordStore {
  return new MemoryLegacyChallengeRecordStore(new Map<string, LegacyChallengeRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyChallengeRecordStore implements LegacyChallengeRecordStore {
  inner: LegacyChallengeRecordStore;
  cache: cache.TtlCache<LegacyChallengeRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyChallengeRecordStore,
    cacheValue: cache.TtlCache<LegacyChallengeRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyChallengeRecord | undefined {
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

  save(item: LegacyChallengeRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyChallengeRecord[] {
    return this.inner.list();
  }
}

export function newCachedLegacyChallengeRecordStore(inner: LegacyChallengeRecordStore, ttl: number, clockValue: clock.Clock): LegacyChallengeRecordStore {
  return new CachedLegacyChallengeRecordStore(
    inner,
    cache.newTtlCache<LegacyChallengeRecord>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy challenge records. Empty fields match all. */
export class LegacyChallengeRecordQuery {
  locale: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBudget: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyChallengeRecord): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyChallengeRecord[]): LegacyChallengeRecord[] {
    const matched = collections.filter(items, (candidate: LegacyChallengeRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyChallengeRecords(store: LegacyChallengeRecordStore, query: LegacyChallengeRecordQuery): LegacyChallengeRecord[] {
  return query.apply(store.list());
}
