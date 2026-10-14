import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingBadgeDraft } from "./rolling-badge-draft.js";

/** Keeps rolling badge drafts by code. */
export interface RollingBadgeDraftStore {
  find(code: string): RollingBadgeDraft | undefined;
  save(item: RollingBadgeDraft): void;
  remove(code: string): boolean;
  list(): RollingBadgeDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingBadgeDraftStore implements RollingBadgeDraftStore {
  items: Map<string, RollingBadgeDraft>;
  order: string[];

  constructor(items: Map<string, RollingBadgeDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingBadgeDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingBadgeDraft): void {
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

  list(): RollingBadgeDraft[] {
    const out: RollingBadgeDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingBadgeDraftStore(): RollingBadgeDraftStore {
  return new MemoryRollingBadgeDraftStore(new Map<string, RollingBadgeDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingBadgeDraftStore implements RollingBadgeDraftStore {
  inner: RollingBadgeDraftStore;
  cache: cache.TtlCache<RollingBadgeDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingBadgeDraftStore,
    cacheValue: cache.TtlCache<RollingBadgeDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingBadgeDraft | undefined {
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

  save(item: RollingBadgeDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingBadgeDraft[] {
    return this.inner.list();
  }
}

export function newCachedRollingBadgeDraftStore(inner: RollingBadgeDraftStore, ttl: number, clockValue: clock.Clock): RollingBadgeDraftStore {
  return new CachedRollingBadgeDraftStore(inner, cache.newTtlCache<RollingBadgeDraft>(128, ttl, clockValue), 0, 0);
}

/** Selects rolling badge drafts. Empty fields match all. */
export class RollingBadgeDraftQuery {
  utmSource: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingBadgeDraft): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingBadgeDraft[]): RollingBadgeDraft[] {
    const matched = collections.filter(items, (candidate: RollingBadgeDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingBadgeDrafts(store: RollingBadgeDraftStore, query: RollingBadgeDraftQuery): RollingBadgeDraft[] {
  return query.apply(store.list());
}
