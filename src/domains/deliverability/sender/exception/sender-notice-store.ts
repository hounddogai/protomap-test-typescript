import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SenderNotice } from "./sender-notice.js";

/** Keeps sender notices by code. */
export interface SenderNoticeStore {
  find(code: string): SenderNotice | undefined;
  save(item: SenderNotice): void;
  remove(code: string): boolean;
  list(): SenderNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySenderNoticeStore implements SenderNoticeStore {
  items: Map<string, SenderNotice>;
  order: string[];

  constructor(items: Map<string, SenderNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SenderNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SenderNotice): void {
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

  list(): SenderNotice[] {
    const out: SenderNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySenderNoticeStore(): SenderNoticeStore {
  return new MemorySenderNoticeStore(new Map<string, SenderNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSenderNoticeStore implements SenderNoticeStore {
  inner: SenderNoticeStore;
  cache: cache.TtlCache<SenderNotice>;
  hits: number;
  misses: number;

  constructor(inner: SenderNoticeStore, cacheValue: cache.TtlCache<SenderNotice>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SenderNotice | undefined {
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

  save(item: SenderNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SenderNotice[] {
    return this.inner.list();
  }
}

export function newCachedSenderNoticeStore(inner: SenderNoticeStore, ttl: number, clockValue: clock.Clock): SenderNoticeStore {
  return new CachedSenderNoticeStore(inner, cache.newTtlCache<SenderNotice>(128, ttl, clockValue), 0, 0);
}

/** Selects sender notices. Empty fields match all. */
export class SenderNoticeQuery {
  unit: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SenderNotice): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SenderNotice[]): SenderNotice[] {
    const matched = collections.filter(items, (candidate: SenderNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSenderNotices(store: SenderNoticeStore, query: SenderNoticeQuery): SenderNotice[] {
  return query.apply(store.list());
}
