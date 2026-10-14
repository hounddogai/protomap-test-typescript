import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryMentionDraft } from "./primary-mention-draft.js";

/** Keeps primary mention drafts by code. */
export interface PrimaryMentionDraftStore {
  find(code: string): PrimaryMentionDraft | undefined;
  save(item: PrimaryMentionDraft): void;
  remove(code: string): boolean;
  list(): PrimaryMentionDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryMentionDraftStore implements PrimaryMentionDraftStore {
  items: Map<string, PrimaryMentionDraft>;
  order: string[];

  constructor(items: Map<string, PrimaryMentionDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryMentionDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryMentionDraft): void {
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

  list(): PrimaryMentionDraft[] {
    const out: PrimaryMentionDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryMentionDraftStore(): PrimaryMentionDraftStore {
  return new MemoryPrimaryMentionDraftStore(new Map<string, PrimaryMentionDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryMentionDraftStore implements PrimaryMentionDraftStore {
  inner: PrimaryMentionDraftStore;
  cache: cache.TtlCache<PrimaryMentionDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryMentionDraftStore,
    cacheValue: cache.TtlCache<PrimaryMentionDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryMentionDraft | undefined {
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

  save(item: PrimaryMentionDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryMentionDraft[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryMentionDraftStore(inner: PrimaryMentionDraftStore, ttl: number, clockValue: clock.Clock): PrimaryMentionDraftStore {
  return new CachedPrimaryMentionDraftStore(inner, cache.newTtlCache<PrimaryMentionDraft>(64, ttl, clockValue), 0, 0);
}

/** Selects primary mention drafts. Empty fields match all. */
export class PrimaryMentionDraftQuery {
  unit: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minWeight: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryMentionDraft): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryMentionDraft[]): PrimaryMentionDraft[] {
    const matched = collections.filter(items, (candidate: PrimaryMentionDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryMentionDrafts(store: PrimaryMentionDraftStore, query: PrimaryMentionDraftQuery): PrimaryMentionDraft[] {
  return query.apply(store.list());
}
