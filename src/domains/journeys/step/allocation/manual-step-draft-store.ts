import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualStepDraft } from "./manual-step-draft.js";

/** Keeps manual step drafts by code. */
export interface ManualStepDraftStore {
  find(code: string): ManualStepDraft | undefined;
  save(item: ManualStepDraft): void;
  remove(code: string): boolean;
  list(): ManualStepDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualStepDraftStore implements ManualStepDraftStore {
  items: Map<string, ManualStepDraft>;
  order: string[];

  constructor(items: Map<string, ManualStepDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualStepDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualStepDraft): void {
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

  list(): ManualStepDraft[] {
    const out: ManualStepDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualStepDraftStore(): ManualStepDraftStore {
  return new MemoryManualStepDraftStore(new Map<string, ManualStepDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualStepDraftStore implements ManualStepDraftStore {
  inner: ManualStepDraftStore;
  cache: cache.TtlCache<ManualStepDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualStepDraftStore,
    cacheValue: cache.TtlCache<ManualStepDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualStepDraft | undefined {
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

  save(item: ManualStepDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualStepDraft[] {
    return this.inner.list();
  }
}

export function newCachedManualStepDraftStore(inner: ManualStepDraftStore, ttl: number, clockValue: clock.Clock): ManualStepDraftStore {
  return new CachedManualStepDraftStore(inner, cache.newTtlCache<ManualStepDraft>(1024, ttl, clockValue), 0, 0);
}

/** Selects manual step drafts. Empty fields match all. */
export class ManualStepDraftQuery {
  locale: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRate: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualStepDraft): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualStepDraft[]): ManualStepDraft[] {
    const matched = collections.filter(items, (candidate: ManualStepDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualStepDrafts(store: ManualStepDraftStore, query: ManualStepDraftQuery): ManualStepDraft[] {
  return query.apply(store.list());
}
