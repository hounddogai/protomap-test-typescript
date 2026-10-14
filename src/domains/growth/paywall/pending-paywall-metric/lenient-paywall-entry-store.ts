import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientPaywallEntry } from "./lenient-paywall-entry.js";

/** Keeps lenient paywall entries by code. */
export interface LenientPaywallEntryStore {
  find(code: string): LenientPaywallEntry | undefined;
  save(item: LenientPaywallEntry): void;
  remove(code: string): boolean;
  list(): LenientPaywallEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientPaywallEntryStore implements LenientPaywallEntryStore {
  items: Map<string, LenientPaywallEntry>;
  order: string[];

  constructor(items: Map<string, LenientPaywallEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientPaywallEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientPaywallEntry): void {
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

  list(): LenientPaywallEntry[] {
    const out: LenientPaywallEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientPaywallEntryStore(): LenientPaywallEntryStore {
  return new MemoryLenientPaywallEntryStore(new Map<string, LenientPaywallEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientPaywallEntryStore implements LenientPaywallEntryStore {
  inner: LenientPaywallEntryStore;
  cache: cache.TtlCache<LenientPaywallEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientPaywallEntryStore,
    cacheValue: cache.TtlCache<LenientPaywallEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientPaywallEntry | undefined {
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

  save(item: LenientPaywallEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientPaywallEntry[] {
    return this.inner.list();
  }
}

export function newCachedLenientPaywallEntryStore(inner: LenientPaywallEntryStore, ttl: number, clockValue: clock.Clock): LenientPaywallEntryStore {
  return new CachedLenientPaywallEntryStore(inner, cache.newTtlCache<LenientPaywallEntry>(1024, ttl, clockValue), 0, 0);
}

/** Selects lenient paywall entries. Empty fields match all. */
export class LenientPaywallEntryQuery {
  title: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMaximum: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientPaywallEntry): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientPaywallEntry[]): LenientPaywallEntry[] {
    const matched = collections.filter(items, (candidate: LenientPaywallEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientPaywallEntries(store: LenientPaywallEntryStore, query: LenientPaywallEntryQuery): LenientPaywallEntry[] {
  return query.apply(store.list());
}
