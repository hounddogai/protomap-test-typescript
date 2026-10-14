import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EnrollmentDraft } from "./enrollment-draft.js";

/** Keeps enrollment drafts by code. */
export interface EnrollmentDraftStore {
  find(code: string): EnrollmentDraft | undefined;
  save(item: EnrollmentDraft): void;
  remove(code: string): boolean;
  list(): EnrollmentDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEnrollmentDraftStore implements EnrollmentDraftStore {
  items: Map<string, EnrollmentDraft>;
  order: string[];

  constructor(items: Map<string, EnrollmentDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EnrollmentDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EnrollmentDraft): void {
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

  list(): EnrollmentDraft[] {
    const out: EnrollmentDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEnrollmentDraftStore(): EnrollmentDraftStore {
  return new MemoryEnrollmentDraftStore(new Map<string, EnrollmentDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEnrollmentDraftStore implements EnrollmentDraftStore {
  inner: EnrollmentDraftStore;
  cache: cache.TtlCache<EnrollmentDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: EnrollmentDraftStore,
    cacheValue: cache.TtlCache<EnrollmentDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EnrollmentDraft | undefined {
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

  save(item: EnrollmentDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EnrollmentDraft[] {
    return this.inner.list();
  }
}

export function newCachedEnrollmentDraftStore(inner: EnrollmentDraftStore, ttl: number, clockValue: clock.Clock): EnrollmentDraftStore {
  return new CachedEnrollmentDraftStore(inner, cache.newTtlCache<EnrollmentDraft>(1024, ttl, clockValue), 0, 0);
}

/** Selects enrollment drafts. Empty fields match all. */
export class EnrollmentDraftQuery {
  segment: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minMaximum: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EnrollmentDraft): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EnrollmentDraft[]): EnrollmentDraft[] {
    const matched = collections.filter(items, (candidate: EnrollmentDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEnrollmentDrafts(store: EnrollmentDraftStore, query: EnrollmentDraftQuery): EnrollmentDraft[] {
  return query.apply(store.list());
}
