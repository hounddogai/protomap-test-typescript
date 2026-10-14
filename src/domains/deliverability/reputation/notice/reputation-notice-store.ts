import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReputationNotice } from "./reputation-notice.js";

/** Keeps reputation notices by code. */
export interface ReputationNoticeStore {
  find(code: string): ReputationNotice | undefined;
  save(item: ReputationNotice): void;
  remove(code: string): boolean;
  list(): ReputationNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReputationNoticeStore implements ReputationNoticeStore {
  items: Map<string, ReputationNotice>;
  order: string[];

  constructor(items: Map<string, ReputationNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReputationNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReputationNotice): void {
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

  list(): ReputationNotice[] {
    const out: ReputationNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReputationNoticeStore(): ReputationNoticeStore {
  return new MemoryReputationNoticeStore(new Map<string, ReputationNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReputationNoticeStore implements ReputationNoticeStore {
  inner: ReputationNoticeStore;
  cache: cache.TtlCache<ReputationNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: ReputationNoticeStore,
    cacheValue: cache.TtlCache<ReputationNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReputationNotice | undefined {
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

  save(item: ReputationNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReputationNotice[] {
    return this.inner.list();
  }
}

export function newCachedReputationNoticeStore(inner: ReputationNoticeStore, ttl: number, clockValue: clock.Clock): ReputationNoticeStore {
  return new CachedReputationNoticeStore(inner, cache.newTtlCache<ReputationNotice>(256, ttl, clockValue), 0, 0);
}

/** Selects reputation notices. Empty fields match all. */
export class ReputationNoticeQuery {
  region: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minRatio: number, statuses: string[], limit: number) {
    this.region = region;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReputationNotice): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReputationNotice[]): ReputationNotice[] {
    const matched = collections.filter(items, (candidate: ReputationNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReputationNotices(store: ReputationNoticeStore, query: ReputationNoticeQuery): ReputationNotice[] {
  return query.apply(store.list());
}
