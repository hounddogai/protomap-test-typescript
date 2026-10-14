import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SubscriptionDraft } from "./subscription-draft.js";

/** Keeps subscription drafts by code. */
export interface SubscriptionDraftStore {
  find(code: string): SubscriptionDraft | undefined;
  save(item: SubscriptionDraft): void;
  remove(code: string): boolean;
  list(): SubscriptionDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySubscriptionDraftStore implements SubscriptionDraftStore {
  items: Map<string, SubscriptionDraft>;
  order: string[];

  constructor(items: Map<string, SubscriptionDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SubscriptionDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SubscriptionDraft): void {
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

  list(): SubscriptionDraft[] {
    const out: SubscriptionDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySubscriptionDraftStore(): SubscriptionDraftStore {
  return new MemorySubscriptionDraftStore(new Map<string, SubscriptionDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSubscriptionDraftStore implements SubscriptionDraftStore {
  inner: SubscriptionDraftStore;
  cache: cache.TtlCache<SubscriptionDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: SubscriptionDraftStore,
    cacheValue: cache.TtlCache<SubscriptionDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SubscriptionDraft | undefined {
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

  save(item: SubscriptionDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SubscriptionDraft[] {
    return this.inner.list();
  }
}

export function newCachedSubscriptionDraftStore(inner: SubscriptionDraftStore, ttl: number, clockValue: clock.Clock): SubscriptionDraftStore {
  return new CachedSubscriptionDraftStore(inner, cache.newTtlCache<SubscriptionDraft>(128, ttl, clockValue), 0, 0);
}

/** Selects subscription drafts. Empty fields match all. */
export class SubscriptionDraftQuery {
  utmSource: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minThreshold: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SubscriptionDraft): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SubscriptionDraft[]): SubscriptionDraft[] {
    const matched = collections.filter(items, (candidate: SubscriptionDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSubscriptionDrafts(store: SubscriptionDraftStore, query: SubscriptionDraftQuery): SubscriptionDraft[] {
  return query.apply(store.list());
}
