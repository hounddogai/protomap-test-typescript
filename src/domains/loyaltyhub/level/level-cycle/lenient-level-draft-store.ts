import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientLevelDraft } from "./lenient-level-draft.js";

/** Keeps lenient level drafts by code. */
export interface LenientLevelDraftStore {
  find(code: string): LenientLevelDraft | undefined;
  save(item: LenientLevelDraft): void;
  remove(code: string): boolean;
  list(): LenientLevelDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientLevelDraftStore implements LenientLevelDraftStore {
  items: Map<string, LenientLevelDraft>;
  order: string[];

  constructor(items: Map<string, LenientLevelDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientLevelDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientLevelDraft): void {
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

  list(): LenientLevelDraft[] {
    const out: LenientLevelDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientLevelDraftStore(): LenientLevelDraftStore {
  return new MemoryLenientLevelDraftStore(new Map<string, LenientLevelDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientLevelDraftStore implements LenientLevelDraftStore {
  inner: LenientLevelDraftStore;
  cache: cache.TtlCache<LenientLevelDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientLevelDraftStore,
    cacheValue: cache.TtlCache<LenientLevelDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientLevelDraft | undefined {
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

  save(item: LenientLevelDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientLevelDraft[] {
    return this.inner.list();
  }
}

export function newCachedLenientLevelDraftStore(inner: LenientLevelDraftStore, ttl: number, clockValue: clock.Clock): LenientLevelDraftStore {
  return new CachedLenientLevelDraftStore(inner, cache.newTtlCache<LenientLevelDraft>(512, ttl, clockValue), 0, 0);
}

/** Selects lenient level drafts. Empty fields match all. */
export class LenientLevelDraftQuery {
  title: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minWeight: number, statuses: string[], limit: number) {
    this.title = title;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientLevelDraft): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientLevelDraft[]): LenientLevelDraft[] {
    const matched = collections.filter(items, (candidate: LenientLevelDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientLevelDrafts(store: LenientLevelDraftStore, query: LenientLevelDraftQuery): LenientLevelDraft[] {
  return query.apply(store.list());
}
