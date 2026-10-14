import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedPaywallDraft } from "./capped-paywall-draft.js";

/** Keeps capped paywall drafts by code. */
export interface CappedPaywallDraftStore {
  find(code: string): CappedPaywallDraft | undefined;
  save(item: CappedPaywallDraft): void;
  remove(code: string): boolean;
  list(): CappedPaywallDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedPaywallDraftStore implements CappedPaywallDraftStore {
  items: Map<string, CappedPaywallDraft>;
  order: string[];

  constructor(items: Map<string, CappedPaywallDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedPaywallDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedPaywallDraft): void {
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

  list(): CappedPaywallDraft[] {
    const out: CappedPaywallDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedPaywallDraftStore(): CappedPaywallDraftStore {
  return new MemoryCappedPaywallDraftStore(new Map<string, CappedPaywallDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedPaywallDraftStore implements CappedPaywallDraftStore {
  inner: CappedPaywallDraftStore;
  cache: cache.TtlCache<CappedPaywallDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedPaywallDraftStore,
    cacheValue: cache.TtlCache<CappedPaywallDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedPaywallDraft | undefined {
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

  save(item: CappedPaywallDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedPaywallDraft[] {
    return this.inner.list();
  }
}

export function newCachedCappedPaywallDraftStore(inner: CappedPaywallDraftStore, ttl: number, clockValue: clock.Clock): CappedPaywallDraftStore {
  return new CachedCappedPaywallDraftStore(inner, cache.newTtlCache<CappedPaywallDraft>(1024, ttl, clockValue), 0, 0);
}

/** Selects capped paywall drafts. Empty fields match all. */
export class CappedPaywallDraftQuery {
  title: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMargin: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedPaywallDraft): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedPaywallDraft[]): CappedPaywallDraft[] {
    const matched = collections.filter(items, (candidate: CappedPaywallDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedPaywallDrafts(store: CappedPaywallDraftStore, query: CappedPaywallDraftQuery): CappedPaywallDraft[] {
  return query.apply(store.list());
}
