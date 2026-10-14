import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualBounceNotice } from "./manual-bounce-notice.js";

/** Keeps manual bounce notices by code. */
export interface ManualBounceNoticeStore {
  find(code: string): ManualBounceNotice | undefined;
  save(item: ManualBounceNotice): void;
  remove(code: string): boolean;
  list(): ManualBounceNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualBounceNoticeStore implements ManualBounceNoticeStore {
  items: Map<string, ManualBounceNotice>;
  order: string[];

  constructor(items: Map<string, ManualBounceNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualBounceNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualBounceNotice): void {
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

  list(): ManualBounceNotice[] {
    const out: ManualBounceNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualBounceNoticeStore(): ManualBounceNoticeStore {
  return new MemoryManualBounceNoticeStore(new Map<string, ManualBounceNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualBounceNoticeStore implements ManualBounceNoticeStore {
  inner: ManualBounceNoticeStore;
  cache: cache.TtlCache<ManualBounceNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualBounceNoticeStore,
    cacheValue: cache.TtlCache<ManualBounceNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualBounceNotice | undefined {
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

  save(item: ManualBounceNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualBounceNotice[] {
    return this.inner.list();
  }
}

export function newCachedManualBounceNoticeStore(inner: ManualBounceNoticeStore, ttl: number, clockValue: clock.Clock): ManualBounceNoticeStore {
  return new CachedManualBounceNoticeStore(inner, cache.newTtlCache<ManualBounceNotice>(128, ttl, clockValue), 0, 0);
}

/** Selects manual bounce notices. Empty fields match all. */
export class ManualBounceNoticeQuery {
  country: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minRevision: number, statuses: string[], limit: number) {
    this.country = country;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualBounceNotice): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualBounceNotice[]): ManualBounceNotice[] {
    const matched = collections.filter(items, (candidate: ManualBounceNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualBounceNotices(store: ManualBounceNoticeStore, query: ManualBounceNoticeQuery): ManualBounceNotice[] {
  return query.apply(store.list());
}
