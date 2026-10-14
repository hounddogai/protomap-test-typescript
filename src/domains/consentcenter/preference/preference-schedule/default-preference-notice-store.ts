import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultPreferenceNotice } from "./default-preference-notice.js";

/** Keeps default preference notices by code. */
export interface DefaultPreferenceNoticeStore {
  find(code: string): DefaultPreferenceNotice | undefined;
  save(item: DefaultPreferenceNotice): void;
  remove(code: string): boolean;
  list(): DefaultPreferenceNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultPreferenceNoticeStore implements DefaultPreferenceNoticeStore {
  items: Map<string, DefaultPreferenceNotice>;
  order: string[];

  constructor(items: Map<string, DefaultPreferenceNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultPreferenceNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultPreferenceNotice): void {
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

  list(): DefaultPreferenceNotice[] {
    const out: DefaultPreferenceNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultPreferenceNoticeStore(): DefaultPreferenceNoticeStore {
  return new MemoryDefaultPreferenceNoticeStore(new Map<string, DefaultPreferenceNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultPreferenceNoticeStore implements DefaultPreferenceNoticeStore {
  inner: DefaultPreferenceNoticeStore;
  cache: cache.TtlCache<DefaultPreferenceNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultPreferenceNoticeStore,
    cacheValue: cache.TtlCache<DefaultPreferenceNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultPreferenceNotice | undefined {
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

  save(item: DefaultPreferenceNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultPreferenceNotice[] {
    return this.inner.list();
  }
}

export function newCachedDefaultPreferenceNoticeStore(inner: DefaultPreferenceNoticeStore, ttl: number, clockValue: clock.Clock): DefaultPreferenceNoticeStore {
  return new CachedDefaultPreferenceNoticeStore(
    inner,
    cache.newTtlCache<DefaultPreferenceNotice>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default preference notices. Empty fields match all. */
export class DefaultPreferenceNoticeQuery {
  segment: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minFloorValue: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultPreferenceNotice): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultPreferenceNotice[]): DefaultPreferenceNotice[] {
    const matched = collections.filter(items, (candidate: DefaultPreferenceNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultPreferenceNotices(store: DefaultPreferenceNoticeStore, query: DefaultPreferenceNoticeQuery): DefaultPreferenceNotice[] {
  return query.apply(store.list());
}
