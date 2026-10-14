import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ApprovalNotice } from "./approval-notice.js";

/** Keeps approval notices by code. */
export interface ApprovalNoticeStore {
  find(code: string): ApprovalNotice | undefined;
  save(item: ApprovalNotice): void;
  remove(code: string): boolean;
  list(): ApprovalNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryApprovalNoticeStore implements ApprovalNoticeStore {
  items: Map<string, ApprovalNotice>;
  order: string[];

  constructor(items: Map<string, ApprovalNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ApprovalNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ApprovalNotice): void {
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

  list(): ApprovalNotice[] {
    const out: ApprovalNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryApprovalNoticeStore(): ApprovalNoticeStore {
  return new MemoryApprovalNoticeStore(new Map<string, ApprovalNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedApprovalNoticeStore implements ApprovalNoticeStore {
  inner: ApprovalNoticeStore;
  cache: cache.TtlCache<ApprovalNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: ApprovalNoticeStore,
    cacheValue: cache.TtlCache<ApprovalNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ApprovalNotice | undefined {
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

  save(item: ApprovalNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ApprovalNotice[] {
    return this.inner.list();
  }
}

export function newCachedApprovalNoticeStore(inner: ApprovalNoticeStore, ttl: number, clockValue: clock.Clock): ApprovalNoticeStore {
  return new CachedApprovalNoticeStore(inner, cache.newTtlCache<ApprovalNotice>(128, ttl, clockValue), 0, 0);
}

/** Selects approval notices. Empty fields match all. */
export class ApprovalNoticeQuery {
  source: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minThreshold: number, statuses: string[], limit: number) {
    this.source = source;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ApprovalNotice): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ApprovalNotice[]): ApprovalNotice[] {
    const matched = collections.filter(items, (candidate: ApprovalNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findApprovalNotices(store: ApprovalNoticeStore, query: ApprovalNoticeQuery): ApprovalNotice[] {
  return query.apply(store.list());
}
