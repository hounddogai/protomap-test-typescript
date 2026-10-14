import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictTierDraft } from "./strict-tier-draft.js";

/** Keeps strict tier drafts by code. */
export interface StrictTierDraftStore {
  find(code: string): StrictTierDraft | undefined;
  save(item: StrictTierDraft): void;
  remove(code: string): boolean;
  list(): StrictTierDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictTierDraftStore implements StrictTierDraftStore {
  items: Map<string, StrictTierDraft>;
  order: string[];

  constructor(items: Map<string, StrictTierDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictTierDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictTierDraft): void {
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

  list(): StrictTierDraft[] {
    const out: StrictTierDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictTierDraftStore(): StrictTierDraftStore {
  return new MemoryStrictTierDraftStore(new Map<string, StrictTierDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictTierDraftStore implements StrictTierDraftStore {
  inner: StrictTierDraftStore;
  cache: cache.TtlCache<StrictTierDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictTierDraftStore,
    cacheValue: cache.TtlCache<StrictTierDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictTierDraft | undefined {
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

  save(item: StrictTierDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictTierDraft[] {
    return this.inner.list();
  }
}

export function newCachedStrictTierDraftStore(inner: StrictTierDraftStore, ttl: number, clockValue: clock.Clock): StrictTierDraftStore {
  return new CachedStrictTierDraftStore(inner, cache.newTtlCache<StrictTierDraft>(128, ttl, clockValue), 0, 0);
}

/** Selects strict tier drafts. Empty fields match all. */
export class StrictTierDraftQuery {
  name: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minSequence: number, statuses: string[], limit: number) {
    this.name = name;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictTierDraft): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictTierDraft[]): StrictTierDraft[] {
    const matched = collections.filter(items, (candidate: StrictTierDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictTierDrafts(store: StrictTierDraftStore, query: StrictTierDraftQuery): StrictTierDraft[] {
  return query.apply(store.list());
}
