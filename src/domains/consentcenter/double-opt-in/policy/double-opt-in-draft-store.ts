import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DoubleOptInDraft } from "./double-opt-in-draft.js";

/** Keeps double opt in drafts by code. */
export interface DoubleOptInDraftStore {
  find(code: string): DoubleOptInDraft | undefined;
  save(item: DoubleOptInDraft): void;
  remove(code: string): boolean;
  list(): DoubleOptInDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDoubleOptInDraftStore implements DoubleOptInDraftStore {
  items: Map<string, DoubleOptInDraft>;
  order: string[];

  constructor(items: Map<string, DoubleOptInDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DoubleOptInDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DoubleOptInDraft): void {
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

  list(): DoubleOptInDraft[] {
    const out: DoubleOptInDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDoubleOptInDraftStore(): DoubleOptInDraftStore {
  return new MemoryDoubleOptInDraftStore(new Map<string, DoubleOptInDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDoubleOptInDraftStore implements DoubleOptInDraftStore {
  inner: DoubleOptInDraftStore;
  cache: cache.TtlCache<DoubleOptInDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: DoubleOptInDraftStore,
    cacheValue: cache.TtlCache<DoubleOptInDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DoubleOptInDraft | undefined {
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

  save(item: DoubleOptInDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DoubleOptInDraft[] {
    return this.inner.list();
  }
}

export function newCachedDoubleOptInDraftStore(inner: DoubleOptInDraftStore, ttl: number, clockValue: clock.Clock): DoubleOptInDraftStore {
  return new CachedDoubleOptInDraftStore(inner, cache.newTtlCache<DoubleOptInDraft>(256, ttl, clockValue), 0, 0);
}

/** Selects double opt in drafts. Empty fields match all. */
export class DoubleOptInDraftQuery {
  label: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minScore: number, statuses: string[], limit: number) {
    this.label = label;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DoubleOptInDraft): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DoubleOptInDraft[]): DoubleOptInDraft[] {
    const matched = collections.filter(items, (candidate: DoubleOptInDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDoubleOptInDrafts(store: DoubleOptInDraftStore, query: DoubleOptInDraftQuery): DoubleOptInDraft[] {
  return query.apply(store.list());
}
