import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedStepEntry } from "./capped-step-entry.js";

/** Keeps capped step entries by code. */
export interface CappedStepEntryStore {
  find(code: string): CappedStepEntry | undefined;
  save(item: CappedStepEntry): void;
  remove(code: string): boolean;
  list(): CappedStepEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedStepEntryStore implements CappedStepEntryStore {
  items: Map<string, CappedStepEntry>;
  order: string[];

  constructor(items: Map<string, CappedStepEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedStepEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedStepEntry): void {
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

  list(): CappedStepEntry[] {
    const out: CappedStepEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedStepEntryStore(): CappedStepEntryStore {
  return new MemoryCappedStepEntryStore(new Map<string, CappedStepEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedStepEntryStore implements CappedStepEntryStore {
  inner: CappedStepEntryStore;
  cache: cache.TtlCache<CappedStepEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedStepEntryStore,
    cacheValue: cache.TtlCache<CappedStepEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedStepEntry | undefined {
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

  save(item: CappedStepEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedStepEntry[] {
    return this.inner.list();
  }
}

export function newCachedCappedStepEntryStore(inner: CappedStepEntryStore, ttl: number, clockValue: clock.Clock): CappedStepEntryStore {
  return new CachedCappedStepEntryStore(inner, cache.newTtlCache<CappedStepEntry>(64, ttl, clockValue), 0, 0);
}

/** Selects capped step entries. Empty fields match all. */
export class CappedStepEntryQuery {
  label: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minQuantity: number, statuses: string[], limit: number) {
    this.label = label;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedStepEntry): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedStepEntry[]): CappedStepEntry[] {
    const matched = collections.filter(items, (candidate: CappedStepEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedStepEntries(store: CappedStepEntryStore, query: CappedStepEntryQuery): CappedStepEntry[] {
  return query.apply(store.list());
}
