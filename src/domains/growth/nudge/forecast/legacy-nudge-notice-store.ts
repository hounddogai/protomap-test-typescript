import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyNudgeNotice } from "./legacy-nudge-notice.js";

/** Keeps legacy nudge notices by code. */
export interface LegacyNudgeNoticeStore {
  find(code: string): LegacyNudgeNotice | undefined;
  save(item: LegacyNudgeNotice): void;
  remove(code: string): boolean;
  list(): LegacyNudgeNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyNudgeNoticeStore implements LegacyNudgeNoticeStore {
  items: Map<string, LegacyNudgeNotice>;
  order: string[];

  constructor(items: Map<string, LegacyNudgeNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyNudgeNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyNudgeNotice): void {
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

  list(): LegacyNudgeNotice[] {
    const out: LegacyNudgeNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyNudgeNoticeStore(): LegacyNudgeNoticeStore {
  return new MemoryLegacyNudgeNoticeStore(new Map<string, LegacyNudgeNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyNudgeNoticeStore implements LegacyNudgeNoticeStore {
  inner: LegacyNudgeNoticeStore;
  cache: cache.TtlCache<LegacyNudgeNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyNudgeNoticeStore,
    cacheValue: cache.TtlCache<LegacyNudgeNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyNudgeNotice | undefined {
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

  save(item: LegacyNudgeNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyNudgeNotice[] {
    return this.inner.list();
  }
}

export function newCachedLegacyNudgeNoticeStore(inner: LegacyNudgeNoticeStore, ttl: number, clockValue: clock.Clock): LegacyNudgeNoticeStore {
  return new CachedLegacyNudgeNoticeStore(inner, cache.newTtlCache<LegacyNudgeNotice>(256, ttl, clockValue), 0, 0);
}

/** Selects legacy nudge notices. Empty fields match all. */
export class LegacyNudgeNoticeQuery {
  channel: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyNudgeNotice): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyNudgeNotice[]): LegacyNudgeNotice[] {
    const matched = collections.filter(items, (candidate: LegacyNudgeNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyNudgeNotices(store: LegacyNudgeNoticeStore, query: LegacyNudgeNoticeQuery): LegacyNudgeNotice[] {
  return query.apply(store.list());
}
