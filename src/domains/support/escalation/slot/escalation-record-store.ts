import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EscalationRecord } from "./escalation-record.js";

/** Keeps escalation records by code. */
export interface EscalationRecordStore {
  find(code: string): EscalationRecord | undefined;
  save(item: EscalationRecord): void;
  remove(code: string): boolean;
  list(): EscalationRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEscalationRecordStore implements EscalationRecordStore {
  items: Map<string, EscalationRecord>;
  order: string[];

  constructor(items: Map<string, EscalationRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EscalationRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EscalationRecord): void {
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

  list(): EscalationRecord[] {
    const out: EscalationRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEscalationRecordStore(): EscalationRecordStore {
  return new MemoryEscalationRecordStore(new Map<string, EscalationRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEscalationRecordStore implements EscalationRecordStore {
  inner: EscalationRecordStore;
  cache: cache.TtlCache<EscalationRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: EscalationRecordStore,
    cacheValue: cache.TtlCache<EscalationRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EscalationRecord | undefined {
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

  save(item: EscalationRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EscalationRecord[] {
    return this.inner.list();
  }
}

export function newCachedEscalationRecordStore(inner: EscalationRecordStore, ttl: number, clockValue: clock.Clock): EscalationRecordStore {
  return new CachedEscalationRecordStore(inner, cache.newTtlCache<EscalationRecord>(512, ttl, clockValue), 0, 0);
}

/** Selects escalation records. Empty fields match all. */
export class EscalationRecordQuery {
  segment: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EscalationRecord): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EscalationRecord[]): EscalationRecord[] {
    const matched = collections.filter(items, (candidate: EscalationRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEscalationRecords(store: EscalationRecordStore, query: EscalationRecordQuery): EscalationRecord[] {
  return query.apply(store.list());
}
