import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientSenderNotice } from "./lenient-sender-notice.js";

/** Keeps lenient sender notices by code. */
export interface LenientSenderNoticeStore {
  find(code: string): LenientSenderNotice | undefined;
  save(item: LenientSenderNotice): void;
  remove(code: string): boolean;
  list(): LenientSenderNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientSenderNoticeStore implements LenientSenderNoticeStore {
  items: Map<string, LenientSenderNotice>;
  order: string[];

  constructor(items: Map<string, LenientSenderNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientSenderNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientSenderNotice): void {
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

  list(): LenientSenderNotice[] {
    const out: LenientSenderNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientSenderNoticeStore(): LenientSenderNoticeStore {
  return new MemoryLenientSenderNoticeStore(new Map<string, LenientSenderNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientSenderNoticeStore implements LenientSenderNoticeStore {
  inner: LenientSenderNoticeStore;
  cache: cache.TtlCache<LenientSenderNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientSenderNoticeStore,
    cacheValue: cache.TtlCache<LenientSenderNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientSenderNotice | undefined {
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

  save(item: LenientSenderNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientSenderNotice[] {
    return this.inner.list();
  }
}

export function newCachedLenientSenderNoticeStore(inner: LenientSenderNoticeStore, ttl: number, clockValue: clock.Clock): LenientSenderNoticeStore {
  return new CachedLenientSenderNoticeStore(inner, cache.newTtlCache<LenientSenderNotice>(128, ttl, clockValue), 0, 0);
}

/** Selects lenient sender notices. Empty fields match all. */
export class LenientSenderNoticeQuery {
  region: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minSequence: number, statuses: string[], limit: number) {
    this.region = region;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientSenderNotice): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientSenderNotice[]): LenientSenderNotice[] {
    const matched = collections.filter(items, (candidate: LenientSenderNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientSenderNotices(store: LenientSenderNoticeStore, query: LenientSenderNoticeQuery): LenientSenderNotice[] {
  return query.apply(store.list());
}
