import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CsatEntry } from "./csat-entry.js";

/** Keeps csat entries by code. */
export interface CsatEntryStore {
  find(code: string): CsatEntry | undefined;
  save(item: CsatEntry): void;
  remove(code: string): boolean;
  list(): CsatEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCsatEntryStore implements CsatEntryStore {
  items: Map<string, CsatEntry>;
  order: string[];

  constructor(items: Map<string, CsatEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CsatEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CsatEntry): void {
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

  list(): CsatEntry[] {
    const out: CsatEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCsatEntryStore(): CsatEntryStore {
  return new MemoryCsatEntryStore(new Map<string, CsatEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCsatEntryStore implements CsatEntryStore {
  inner: CsatEntryStore;
  cache: cache.TtlCache<CsatEntry>;
  hits: number;
  misses: number;

  constructor(inner: CsatEntryStore, cacheValue: cache.TtlCache<CsatEntry>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CsatEntry | undefined {
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

  save(item: CsatEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CsatEntry[] {
    return this.inner.list();
  }
}

export function newCachedCsatEntryStore(inner: CsatEntryStore, ttl: number, clockValue: clock.Clock): CsatEntryStore {
  return new CachedCsatEntryStore(inner, cache.newTtlCache<CsatEntry>(256, ttl, clockValue), 0, 0);
}

/** Selects csat entries. Empty fields match all. */
export class CsatEntryQuery {
  label: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minEndsAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CsatEntry): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CsatEntry[]): CsatEntry[] {
    const matched = collections.filter(items, (candidate: CsatEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCsatEntries(store: CsatEntryStore, query: CsatEntryQuery): CsatEntry[] {
  return query.apply(store.list());
}
