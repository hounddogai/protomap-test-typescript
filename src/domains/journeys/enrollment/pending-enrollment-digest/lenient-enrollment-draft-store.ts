import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientEnrollmentDraft } from "./lenient-enrollment-draft.js";

/** Keeps lenient enrollment drafts by code. */
export interface LenientEnrollmentDraftStore {
  find(code: string): LenientEnrollmentDraft | undefined;
  save(item: LenientEnrollmentDraft): void;
  remove(code: string): boolean;
  list(): LenientEnrollmentDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientEnrollmentDraftStore implements LenientEnrollmentDraftStore {
  items: Map<string, LenientEnrollmentDraft>;
  order: string[];

  constructor(items: Map<string, LenientEnrollmentDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientEnrollmentDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientEnrollmentDraft): void {
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

  list(): LenientEnrollmentDraft[] {
    const out: LenientEnrollmentDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientEnrollmentDraftStore(): LenientEnrollmentDraftStore {
  return new MemoryLenientEnrollmentDraftStore(new Map<string, LenientEnrollmentDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientEnrollmentDraftStore implements LenientEnrollmentDraftStore {
  inner: LenientEnrollmentDraftStore;
  cache: cache.TtlCache<LenientEnrollmentDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientEnrollmentDraftStore,
    cacheValue: cache.TtlCache<LenientEnrollmentDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientEnrollmentDraft | undefined {
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

  save(item: LenientEnrollmentDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientEnrollmentDraft[] {
    return this.inner.list();
  }
}

export function newCachedLenientEnrollmentDraftStore(inner: LenientEnrollmentDraftStore, ttl: number, clockValue: clock.Clock): LenientEnrollmentDraftStore {
  return new CachedLenientEnrollmentDraftStore(
    inner,
    cache.newTtlCache<LenientEnrollmentDraft>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient enrollment drafts. Empty fields match all. */
export class LenientEnrollmentDraftQuery {
  name: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientEnrollmentDraft): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientEnrollmentDraft[]): LenientEnrollmentDraft[] {
    const matched = collections.filter(items, (candidate: LenientEnrollmentDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientEnrollmentDrafts(store: LenientEnrollmentDraftStore, query: LenientEnrollmentDraftQuery): LenientEnrollmentDraft[] {
  return query.apply(store.list());
}
