import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StepEntry } from "./step-entry.js";

/** Keeps step entries by code. */
export interface StepEntryStore {
  find(code: string): StepEntry | undefined;
  save(item: StepEntry): void;
  remove(code: string): boolean;
  list(): StepEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStepEntryStore implements StepEntryStore {
  items: Map<string, StepEntry>;
  order: string[];

  constructor(items: Map<string, StepEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StepEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StepEntry): void {
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

  list(): StepEntry[] {
    const out: StepEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStepEntryStore(): StepEntryStore {
  return new MemoryStepEntryStore(new Map<string, StepEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStepEntryStore implements StepEntryStore {
  inner: StepEntryStore;
  cache: cache.TtlCache<StepEntry>;
  hits: number;
  misses: number;

  constructor(inner: StepEntryStore, cacheValue: cache.TtlCache<StepEntry>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StepEntry | undefined {
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

  save(item: StepEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StepEntry[] {
    return this.inner.list();
  }
}

export function newCachedStepEntryStore(inner: StepEntryStore, ttl: number, clockValue: clock.Clock): StepEntryStore {
  return new CachedStepEntryStore(inner, cache.newTtlCache<StepEntry>(256, ttl, clockValue), 0, 0);
}

/** Selects step entries. Empty fields match all. */
export class StepEntryQuery {
  utmSource: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minMaximum: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StepEntry): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StepEntry[]): StepEntry[] {
    const matched = collections.filter(items, (candidate: StepEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStepEntries(store: StepEntryStore, query: StepEntryQuery): StepEntry[] {
  return query.apply(store.list());
}
