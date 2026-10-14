import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalApprovalNotice } from "./regional-approval-notice.js";

/** Keeps regional approval notices by code. */
export interface RegionalApprovalNoticeStore {
  find(code: string): RegionalApprovalNotice | undefined;
  save(item: RegionalApprovalNotice): void;
  remove(code: string): boolean;
  list(): RegionalApprovalNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalApprovalNoticeStore implements RegionalApprovalNoticeStore {
  items: Map<string, RegionalApprovalNotice>;
  order: string[];

  constructor(items: Map<string, RegionalApprovalNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalApprovalNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalApprovalNotice): void {
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

  list(): RegionalApprovalNotice[] {
    const out: RegionalApprovalNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalApprovalNoticeStore(): RegionalApprovalNoticeStore {
  return new MemoryRegionalApprovalNoticeStore(new Map<string, RegionalApprovalNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalApprovalNoticeStore implements RegionalApprovalNoticeStore {
  inner: RegionalApprovalNoticeStore;
  cache: cache.TtlCache<RegionalApprovalNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalApprovalNoticeStore,
    cacheValue: cache.TtlCache<RegionalApprovalNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalApprovalNotice | undefined {
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

  save(item: RegionalApprovalNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalApprovalNotice[] {
    return this.inner.list();
  }
}

export function newCachedRegionalApprovalNoticeStore(inner: RegionalApprovalNoticeStore, ttl: number, clockValue: clock.Clock): RegionalApprovalNoticeStore {
  return new CachedRegionalApprovalNoticeStore(
    inner,
    cache.newTtlCache<RegionalApprovalNotice>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional approval notices. Empty fields match all. */
export class RegionalApprovalNoticeQuery {
  label: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minEndsAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalApprovalNotice): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalApprovalNotice[]): RegionalApprovalNotice[] {
    const matched = collections.filter(items, (candidate: RegionalApprovalNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalApprovalNotices(store: RegionalApprovalNoticeStore, query: RegionalApprovalNoticeQuery): RegionalApprovalNotice[] {
  return query.apply(store.list());
}
