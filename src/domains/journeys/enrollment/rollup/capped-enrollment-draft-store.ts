import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedEnrollmentDraft } from "./capped-enrollment-draft.js";

/** Keeps capped enrollment drafts by code. */
export interface CappedEnrollmentDraftStore {
  find(code: string): CappedEnrollmentDraft | undefined;
  save(item: CappedEnrollmentDraft): void;
  remove(code: string): boolean;
  list(): CappedEnrollmentDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedEnrollmentDraftStore implements CappedEnrollmentDraftStore {
  items: Map<string, CappedEnrollmentDraft>;
  order: string[];

  constructor(items: Map<string, CappedEnrollmentDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedEnrollmentDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedEnrollmentDraft): void {
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

  list(): CappedEnrollmentDraft[] {
    const out: CappedEnrollmentDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedEnrollmentDraftStore(): CappedEnrollmentDraftStore {
  return new MemoryCappedEnrollmentDraftStore(new Map<string, CappedEnrollmentDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedEnrollmentDraftStore implements CappedEnrollmentDraftStore {
  inner: CappedEnrollmentDraftStore;
  cache: cache.TtlCache<CappedEnrollmentDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedEnrollmentDraftStore,
    cacheValue: cache.TtlCache<CappedEnrollmentDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedEnrollmentDraft | undefined {
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

  save(item: CappedEnrollmentDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedEnrollmentDraft[] {
    return this.inner.list();
  }
}

export function newCachedCappedEnrollmentDraftStore(inner: CappedEnrollmentDraftStore, ttl: number, clockValue: clock.Clock): CappedEnrollmentDraftStore {
  return new CachedCappedEnrollmentDraftStore(
    inner,
    cache.newTtlCache<CappedEnrollmentDraft>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped enrollment drafts. Empty fields match all. */
export class CappedEnrollmentDraftQuery {
  country: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minOpenRate: number, statuses: string[], limit: number) {
    this.country = country;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedEnrollmentDraft): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedEnrollmentDraft[]): CappedEnrollmentDraft[] {
    const matched = collections.filter(items, (candidate: CappedEnrollmentDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedEnrollmentDrafts(store: CappedEnrollmentDraftStore, query: CappedEnrollmentDraftQuery): CappedEnrollmentDraft[] {
  return query.apply(store.list());
}
