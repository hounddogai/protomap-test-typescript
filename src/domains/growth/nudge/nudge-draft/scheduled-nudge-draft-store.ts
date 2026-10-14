import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledNudgeDraft } from "./scheduled-nudge-draft.js";

/** Keeps scheduled nudge drafts by code. */
export interface ScheduledNudgeDraftStore {
  find(code: string): ScheduledNudgeDraft | undefined;
  save(item: ScheduledNudgeDraft): void;
  remove(code: string): boolean;
  list(): ScheduledNudgeDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledNudgeDraftStore implements ScheduledNudgeDraftStore {
  items: Map<string, ScheduledNudgeDraft>;
  order: string[];

  constructor(items: Map<string, ScheduledNudgeDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledNudgeDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledNudgeDraft): void {
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

  list(): ScheduledNudgeDraft[] {
    const out: ScheduledNudgeDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledNudgeDraftStore(): ScheduledNudgeDraftStore {
  return new MemoryScheduledNudgeDraftStore(new Map<string, ScheduledNudgeDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledNudgeDraftStore implements ScheduledNudgeDraftStore {
  inner: ScheduledNudgeDraftStore;
  cache: cache.TtlCache<ScheduledNudgeDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledNudgeDraftStore,
    cacheValue: cache.TtlCache<ScheduledNudgeDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledNudgeDraft | undefined {
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

  save(item: ScheduledNudgeDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledNudgeDraft[] {
    return this.inner.list();
  }
}

export function newCachedScheduledNudgeDraftStore(inner: ScheduledNudgeDraftStore, ttl: number, clockValue: clock.Clock): ScheduledNudgeDraftStore {
  return new CachedScheduledNudgeDraftStore(inner, cache.newTtlCache<ScheduledNudgeDraft>(128, ttl, clockValue), 0, 0);
}

/** Selects scheduled nudge drafts. Empty fields match all. */
export class ScheduledNudgeDraftQuery {
  title: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledNudgeDraft): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledNudgeDraft[]): ScheduledNudgeDraft[] {
    const matched = collections.filter(items, (candidate: ScheduledNudgeDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledNudgeDrafts(store: ScheduledNudgeDraftStore, query: ScheduledNudgeDraftQuery): ScheduledNudgeDraft[] {
  return query.apply(store.list());
}
