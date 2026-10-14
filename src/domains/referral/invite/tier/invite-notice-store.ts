import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InviteNotice } from "./invite-notice.js";

/** Keeps invite notices by code. */
export interface InviteNoticeStore {
  find(code: string): InviteNotice | undefined;
  save(item: InviteNotice): void;
  remove(code: string): boolean;
  list(): InviteNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInviteNoticeStore implements InviteNoticeStore {
  items: Map<string, InviteNotice>;
  order: string[];

  constructor(items: Map<string, InviteNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InviteNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InviteNotice): void {
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

  list(): InviteNotice[] {
    const out: InviteNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInviteNoticeStore(): InviteNoticeStore {
  return new MemoryInviteNoticeStore(new Map<string, InviteNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInviteNoticeStore implements InviteNoticeStore {
  inner: InviteNoticeStore;
  cache: cache.TtlCache<InviteNotice>;
  hits: number;
  misses: number;

  constructor(inner: InviteNoticeStore, cacheValue: cache.TtlCache<InviteNotice>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InviteNotice | undefined {
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

  save(item: InviteNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InviteNotice[] {
    return this.inner.list();
  }
}

export function newCachedInviteNoticeStore(inner: InviteNoticeStore, ttl: number, clockValue: clock.Clock): InviteNoticeStore {
  return new CachedInviteNoticeStore(inner, cache.newTtlCache<InviteNotice>(1024, ttl, clockValue), 0, 0);
}

/** Selects invite notices. Empty fields match all. */
export class InviteNoticeQuery {
  label: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minThreshold: number, statuses: string[], limit: number) {
    this.label = label;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InviteNotice): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InviteNotice[]): InviteNotice[] {
    const matched = collections.filter(items, (candidate: InviteNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInviteNotices(store: InviteNoticeStore, query: InviteNoticeQuery): InviteNotice[] {
  return query.apply(store.list());
}
