import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedReputationDraft } from "./capped-reputation-draft.js";

/** Keeps capped reputation drafts by code. */
export interface CappedReputationDraftStore {
  find(code: string): CappedReputationDraft | undefined;
  save(item: CappedReputationDraft): void;
  remove(code: string): boolean;
  list(): CappedReputationDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedReputationDraftStore implements CappedReputationDraftStore {
  items: Map<string, CappedReputationDraft>;
  order: string[];

  constructor(items: Map<string, CappedReputationDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedReputationDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedReputationDraft): void {
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

  list(): CappedReputationDraft[] {
    const out: CappedReputationDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedReputationDraftStore(): CappedReputationDraftStore {
  return new MemoryCappedReputationDraftStore(new Map<string, CappedReputationDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedReputationDraftStore implements CappedReputationDraftStore {
  inner: CappedReputationDraftStore;
  cache: cache.TtlCache<CappedReputationDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedReputationDraftStore,
    cacheValue: cache.TtlCache<CappedReputationDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedReputationDraft | undefined {
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

  save(item: CappedReputationDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedReputationDraft[] {
    return this.inner.list();
  }
}

export function newCachedCappedReputationDraftStore(inner: CappedReputationDraftStore, ttl: number, clockValue: clock.Clock): CappedReputationDraftStore {
  return new CachedCappedReputationDraftStore(
    inner,
    cache.newTtlCache<CappedReputationDraft>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped reputation drafts. Empty fields match all. */
export class CappedReputationDraftQuery {
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

  matches(item: CappedReputationDraft): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedReputationDraft[]): CappedReputationDraft[] {
    const matched = collections.filter(items, (candidate: CappedReputationDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedReputationDrafts(store: CappedReputationDraftStore, query: CappedReputationDraftQuery): CappedReputationDraft[] {
  return query.apply(store.list());
}
