import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultEnrollmentDraft } from "./default-enrollment-draft.js";

/** Keeps default enrollment drafts by code. */
export interface DefaultEnrollmentDraftStore {
  find(code: string): DefaultEnrollmentDraft | undefined;
  save(item: DefaultEnrollmentDraft): void;
  remove(code: string): boolean;
  list(): DefaultEnrollmentDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultEnrollmentDraftStore implements DefaultEnrollmentDraftStore {
  items: Map<string, DefaultEnrollmentDraft>;
  order: string[];

  constructor(items: Map<string, DefaultEnrollmentDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultEnrollmentDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultEnrollmentDraft): void {
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

  list(): DefaultEnrollmentDraft[] {
    const out: DefaultEnrollmentDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultEnrollmentDraftStore(): DefaultEnrollmentDraftStore {
  return new MemoryDefaultEnrollmentDraftStore(new Map<string, DefaultEnrollmentDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultEnrollmentDraftStore implements DefaultEnrollmentDraftStore {
  inner: DefaultEnrollmentDraftStore;
  cache: cache.TtlCache<DefaultEnrollmentDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultEnrollmentDraftStore,
    cacheValue: cache.TtlCache<DefaultEnrollmentDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultEnrollmentDraft | undefined {
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

  save(item: DefaultEnrollmentDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultEnrollmentDraft[] {
    return this.inner.list();
  }
}

export function newCachedDefaultEnrollmentDraftStore(inner: DefaultEnrollmentDraftStore, ttl: number, clockValue: clock.Clock): DefaultEnrollmentDraftStore {
  return new CachedDefaultEnrollmentDraftStore(
    inner,
    cache.newTtlCache<DefaultEnrollmentDraft>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default enrollment drafts. Empty fields match all. */
export class DefaultEnrollmentDraftQuery {
  label: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMinimum: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultEnrollmentDraft): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultEnrollmentDraft[]): DefaultEnrollmentDraft[] {
    const matched = collections.filter(items, (candidate: DefaultEnrollmentDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultEnrollmentDrafts(store: DefaultEnrollmentDraftStore, query: DefaultEnrollmentDraftQuery): DefaultEnrollmentDraft[] {
  return query.apply(store.list());
}
