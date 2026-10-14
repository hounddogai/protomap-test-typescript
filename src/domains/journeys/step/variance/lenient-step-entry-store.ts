import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientStepEntry } from "./lenient-step-entry.js";

/** Keeps lenient step entries by code. */
export interface LenientStepEntryStore {
  find(code: string): LenientStepEntry | undefined;
  save(item: LenientStepEntry): void;
  remove(code: string): boolean;
  list(): LenientStepEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientStepEntryStore implements LenientStepEntryStore {
  items: Map<string, LenientStepEntry>;
  order: string[];

  constructor(items: Map<string, LenientStepEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientStepEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientStepEntry): void {
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

  list(): LenientStepEntry[] {
    const out: LenientStepEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientStepEntryStore(): LenientStepEntryStore {
  return new MemoryLenientStepEntryStore(new Map<string, LenientStepEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientStepEntryStore implements LenientStepEntryStore {
  inner: LenientStepEntryStore;
  cache: cache.TtlCache<LenientStepEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientStepEntryStore,
    cacheValue: cache.TtlCache<LenientStepEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientStepEntry | undefined {
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

  save(item: LenientStepEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientStepEntry[] {
    return this.inner.list();
  }
}

export function newCachedLenientStepEntryStore(inner: LenientStepEntryStore, ttl: number, clockValue: clock.Clock): LenientStepEntryStore {
  return new CachedLenientStepEntryStore(inner, cache.newTtlCache<LenientStepEntry>(64, ttl, clockValue), 0, 0);
}

/** Selects lenient step entries. Empty fields match all. */
export class LenientStepEntryQuery {
  channel: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minVersion: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientStepEntry): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientStepEntry[]): LenientStepEntry[] {
    const matched = collections.filter(items, (candidate: LenientStepEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientStepEntries(store: LenientStepEntryStore, query: LenientStepEntryQuery): LenientStepEntry[] {
  return query.apply(store.list());
}
