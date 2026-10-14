import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedCreditDraft } from "./capped-credit-draft.js";

/** Keeps capped credit drafts by code. */
export interface CappedCreditDraftStore {
  find(code: string): CappedCreditDraft | undefined;
  save(item: CappedCreditDraft): void;
  remove(code: string): boolean;
  list(): CappedCreditDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedCreditDraftStore implements CappedCreditDraftStore {
  items: Map<string, CappedCreditDraft>;
  order: string[];

  constructor(items: Map<string, CappedCreditDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedCreditDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedCreditDraft): void {
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

  list(): CappedCreditDraft[] {
    const out: CappedCreditDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedCreditDraftStore(): CappedCreditDraftStore {
  return new MemoryCappedCreditDraftStore(new Map<string, CappedCreditDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedCreditDraftStore implements CappedCreditDraftStore {
  inner: CappedCreditDraftStore;
  cache: cache.TtlCache<CappedCreditDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedCreditDraftStore,
    cacheValue: cache.TtlCache<CappedCreditDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedCreditDraft | undefined {
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

  save(item: CappedCreditDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedCreditDraft[] {
    return this.inner.list();
  }
}

export function newCachedCappedCreditDraftStore(inner: CappedCreditDraftStore, ttl: number, clockValue: clock.Clock): CappedCreditDraftStore {
  return new CachedCappedCreditDraftStore(inner, cache.newTtlCache<CappedCreditDraft>(64, ttl, clockValue), 0, 0);
}

/** Selects capped credit drafts. Empty fields match all. */
export class CappedCreditDraftQuery {
  title: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minSequence: number, statuses: string[], limit: number) {
    this.title = title;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedCreditDraft): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedCreditDraft[]): CappedCreditDraft[] {
    const matched = collections.filter(items, (candidate: CappedCreditDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedCreditDrafts(store: CappedCreditDraftStore, query: CappedCreditDraftQuery): CappedCreditDraft[] {
  return query.apply(store.list());
}
