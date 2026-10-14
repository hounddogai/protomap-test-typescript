import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualFrequencyDraft } from "./manual-frequency-draft.js";

/** Keeps manual frequency drafts by code. */
export interface ManualFrequencyDraftStore {
  find(code: string): ManualFrequencyDraft | undefined;
  save(item: ManualFrequencyDraft): void;
  remove(code: string): boolean;
  list(): ManualFrequencyDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualFrequencyDraftStore implements ManualFrequencyDraftStore {
  items: Map<string, ManualFrequencyDraft>;
  order: string[];

  constructor(items: Map<string, ManualFrequencyDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualFrequencyDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualFrequencyDraft): void {
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

  list(): ManualFrequencyDraft[] {
    const out: ManualFrequencyDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualFrequencyDraftStore(): ManualFrequencyDraftStore {
  return new MemoryManualFrequencyDraftStore(new Map<string, ManualFrequencyDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualFrequencyDraftStore implements ManualFrequencyDraftStore {
  inner: ManualFrequencyDraftStore;
  cache: cache.TtlCache<ManualFrequencyDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualFrequencyDraftStore,
    cacheValue: cache.TtlCache<ManualFrequencyDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualFrequencyDraft | undefined {
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

  save(item: ManualFrequencyDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualFrequencyDraft[] {
    return this.inner.list();
  }
}

export function newCachedManualFrequencyDraftStore(inner: ManualFrequencyDraftStore, ttl: number, clockValue: clock.Clock): ManualFrequencyDraftStore {
  return new CachedManualFrequencyDraftStore(
    inner,
    cache.newTtlCache<ManualFrequencyDraft>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual frequency drafts. Empty fields match all. */
export class ManualFrequencyDraftQuery {
  title: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minBid: number, statuses: string[], limit: number) {
    this.title = title;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualFrequencyDraft): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualFrequencyDraft[]): ManualFrequencyDraft[] {
    const matched = collections.filter(items, (candidate: ManualFrequencyDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualFrequencyDrafts(store: ManualFrequencyDraftStore, query: ManualFrequencyDraftQuery): ManualFrequencyDraft[] {
  return query.apply(store.list());
}
