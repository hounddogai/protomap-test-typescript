import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InviteEntry } from "./invite-entry.js";

/** Keeps invite entries by code. */
export interface InviteEntryStore {
  find(code: string): InviteEntry | undefined;
  save(item: InviteEntry): void;
  remove(code: string): boolean;
  list(): InviteEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInviteEntryStore implements InviteEntryStore {
  items: Map<string, InviteEntry>;
  order: string[];

  constructor(items: Map<string, InviteEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InviteEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InviteEntry): void {
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

  list(): InviteEntry[] {
    const out: InviteEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInviteEntryStore(): InviteEntryStore {
  return new MemoryInviteEntryStore(new Map<string, InviteEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInviteEntryStore implements InviteEntryStore {
  inner: InviteEntryStore;
  cache: cache.TtlCache<InviteEntry>;
  hits: number;
  misses: number;

  constructor(inner: InviteEntryStore, cacheValue: cache.TtlCache<InviteEntry>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InviteEntry | undefined {
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

  save(item: InviteEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InviteEntry[] {
    return this.inner.list();
  }
}

export function newCachedInviteEntryStore(inner: InviteEntryStore, ttl: number, clockValue: clock.Clock): InviteEntryStore {
  return new CachedInviteEntryStore(inner, cache.newTtlCache<InviteEntry>(256, ttl, clockValue), 0, 0);
}

/** Selects invite entries. Empty fields match all. */
export class InviteEntryQuery {
  segment: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InviteEntry): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InviteEntry[]): InviteEntry[] {
    const matched = collections.filter(items, (candidate: InviteEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInviteEntries(store: InviteEntryStore, query: InviteEntryQuery): InviteEntry[] {
  return query.apply(store.list());
}
