import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ApprovalEntry } from "./approval-entry.js";

/** Keeps approval entries by code. */
export interface ApprovalEntryStore {
  find(code: string): ApprovalEntry | undefined;
  save(item: ApprovalEntry): void;
  remove(code: string): boolean;
  list(): ApprovalEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryApprovalEntryStore implements ApprovalEntryStore {
  items: Map<string, ApprovalEntry>;
  order: string[];

  constructor(items: Map<string, ApprovalEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ApprovalEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ApprovalEntry): void {
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

  list(): ApprovalEntry[] {
    const out: ApprovalEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryApprovalEntryStore(): ApprovalEntryStore {
  return new MemoryApprovalEntryStore(new Map<string, ApprovalEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedApprovalEntryStore implements ApprovalEntryStore {
  inner: ApprovalEntryStore;
  cache: cache.TtlCache<ApprovalEntry>;
  hits: number;
  misses: number;

  constructor(inner: ApprovalEntryStore, cacheValue: cache.TtlCache<ApprovalEntry>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ApprovalEntry | undefined {
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

  save(item: ApprovalEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ApprovalEntry[] {
    return this.inner.list();
  }
}

export function newCachedApprovalEntryStore(inner: ApprovalEntryStore, ttl: number, clockValue: clock.Clock): ApprovalEntryStore {
  return new CachedApprovalEntryStore(inner, cache.newTtlCache<ApprovalEntry>(128, ttl, clockValue), 0, 0);
}

/** Selects approval entries. Empty fields match all. */
export class ApprovalEntryQuery {
  locale: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minWindowDays: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ApprovalEntry): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ApprovalEntry[]): ApprovalEntry[] {
    const matched = collections.filter(items, (candidate: ApprovalEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findApprovalEntries(store: ApprovalEntryStore, query: ApprovalEntryQuery): ApprovalEntry[] {
  return query.apply(store.list());
}
