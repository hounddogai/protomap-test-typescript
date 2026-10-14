import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReplyNotice } from "./reply-notice.js";

/** Keeps reply notices by code. */
export interface ReplyNoticeStore {
  find(code: string): ReplyNotice | undefined;
  save(item: ReplyNotice): void;
  remove(code: string): boolean;
  list(): ReplyNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReplyNoticeStore implements ReplyNoticeStore {
  items: Map<string, ReplyNotice>;
  order: string[];

  constructor(items: Map<string, ReplyNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReplyNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReplyNotice): void {
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

  list(): ReplyNotice[] {
    const out: ReplyNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReplyNoticeStore(): ReplyNoticeStore {
  return new MemoryReplyNoticeStore(new Map<string, ReplyNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReplyNoticeStore implements ReplyNoticeStore {
  inner: ReplyNoticeStore;
  cache: cache.TtlCache<ReplyNotice>;
  hits: number;
  misses: number;

  constructor(inner: ReplyNoticeStore, cacheValue: cache.TtlCache<ReplyNotice>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReplyNotice | undefined {
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

  save(item: ReplyNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReplyNotice[] {
    return this.inner.list();
  }
}

export function newCachedReplyNoticeStore(inner: ReplyNoticeStore, ttl: number, clockValue: clock.Clock): ReplyNoticeStore {
  return new CachedReplyNoticeStore(inner, cache.newTtlCache<ReplyNotice>(512, ttl, clockValue), 0, 0);
}

/** Selects reply notices. Empty fields match all. */
export class ReplyNoticeQuery {
  label: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minWeight: number, statuses: string[], limit: number) {
    this.label = label;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReplyNotice): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReplyNotice[]): ReplyNotice[] {
    const matched = collections.filter(items, (candidate: ReplyNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReplyNotices(store: ReplyNoticeStore, query: ReplyNoticeQuery): ReplyNotice[] {
  return query.apply(store.list());
}
