import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PacingNotice } from "./pacing-notice.js";

/** Keeps pacing notices by code. */
export interface PacingNoticeStore {
  find(code: string): PacingNotice | undefined;
  save(item: PacingNotice): void;
  remove(code: string): boolean;
  list(): PacingNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPacingNoticeStore implements PacingNoticeStore {
  items: Map<string, PacingNotice>;
  order: string[];

  constructor(items: Map<string, PacingNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PacingNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PacingNotice): void {
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

  list(): PacingNotice[] {
    const out: PacingNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPacingNoticeStore(): PacingNoticeStore {
  return new MemoryPacingNoticeStore(new Map<string, PacingNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPacingNoticeStore implements PacingNoticeStore {
  inner: PacingNoticeStore;
  cache: cache.TtlCache<PacingNotice>;
  hits: number;
  misses: number;

  constructor(inner: PacingNoticeStore, cacheValue: cache.TtlCache<PacingNotice>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PacingNotice | undefined {
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

  save(item: PacingNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PacingNotice[] {
    return this.inner.list();
  }
}

export function newCachedPacingNoticeStore(inner: PacingNoticeStore, ttl: number, clockValue: clock.Clock): PacingNoticeStore {
  return new CachedPacingNoticeStore(inner, cache.newTtlCache<PacingNotice>(512, ttl, clockValue), 0, 0);
}

/** Selects pacing notices. Empty fields match all. */
export class PacingNoticeQuery {
  region: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minAmount: number, statuses: string[], limit: number) {
    this.region = region;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PacingNotice): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PacingNotice[]): PacingNotice[] {
    const matched = collections.filter(items, (candidate: PacingNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPacingNotices(store: PacingNoticeStore, query: PacingNoticeQuery): PacingNotice[] {
  return query.apply(store.list());
}
