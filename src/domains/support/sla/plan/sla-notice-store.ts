import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SlaNotice } from "./sla-notice.js";

/** Keeps sla notices by code. */
export interface SlaNoticeStore {
  find(code: string): SlaNotice | undefined;
  save(item: SlaNotice): void;
  remove(code: string): boolean;
  list(): SlaNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySlaNoticeStore implements SlaNoticeStore {
  items: Map<string, SlaNotice>;
  order: string[];

  constructor(items: Map<string, SlaNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SlaNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SlaNotice): void {
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

  list(): SlaNotice[] {
    const out: SlaNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySlaNoticeStore(): SlaNoticeStore {
  return new MemorySlaNoticeStore(new Map<string, SlaNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSlaNoticeStore implements SlaNoticeStore {
  inner: SlaNoticeStore;
  cache: cache.TtlCache<SlaNotice>;
  hits: number;
  misses: number;

  constructor(inner: SlaNoticeStore, cacheValue: cache.TtlCache<SlaNotice>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SlaNotice | undefined {
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

  save(item: SlaNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SlaNotice[] {
    return this.inner.list();
  }
}

export function newCachedSlaNoticeStore(inner: SlaNoticeStore, ttl: number, clockValue: clock.Clock): SlaNoticeStore {
  return new CachedSlaNoticeStore(inner, cache.newTtlCache<SlaNotice>(512, ttl, clockValue), 0, 0);
}

/** Selects sla notices. Empty fields match all. */
export class SlaNoticeQuery {
  name: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minFloorValue: number, statuses: string[], limit: number) {
    this.name = name;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SlaNotice): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SlaNotice[]): SlaNotice[] {
    const matched = collections.filter(items, (candidate: SlaNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSlaNotices(store: SlaNoticeStore, query: SlaNoticeQuery): SlaNotice[] {
  return query.apply(store.list());
}
