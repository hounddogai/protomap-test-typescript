import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReputationDraft } from "./reputation-draft.js";

/** Keeps reputation drafts by code. */
export interface ReputationDraftStore {
  find(code: string): ReputationDraft | undefined;
  save(item: ReputationDraft): void;
  remove(code: string): boolean;
  list(): ReputationDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReputationDraftStore implements ReputationDraftStore {
  items: Map<string, ReputationDraft>;
  order: string[];

  constructor(items: Map<string, ReputationDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReputationDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReputationDraft): void {
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

  list(): ReputationDraft[] {
    const out: ReputationDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReputationDraftStore(): ReputationDraftStore {
  return new MemoryReputationDraftStore(new Map<string, ReputationDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReputationDraftStore implements ReputationDraftStore {
  inner: ReputationDraftStore;
  cache: cache.TtlCache<ReputationDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: ReputationDraftStore,
    cacheValue: cache.TtlCache<ReputationDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReputationDraft | undefined {
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

  save(item: ReputationDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReputationDraft[] {
    return this.inner.list();
  }
}

export function newCachedReputationDraftStore(inner: ReputationDraftStore, ttl: number, clockValue: clock.Clock): ReputationDraftStore {
  return new CachedReputationDraftStore(inner, cache.newTtlCache<ReputationDraft>(256, ttl, clockValue), 0, 0);
}

/** Selects reputation drafts. Empty fields match all. */
export class ReputationDraftQuery {
  name: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minWindowDays: number, statuses: string[], limit: number) {
    this.name = name;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReputationDraft): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReputationDraft[]): ReputationDraft[] {
    const matched = collections.filter(items, (candidate: ReputationDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReputationDrafts(store: ReputationDraftStore, query: ReputationDraftQuery): ReputationDraft[] {
  return query.apply(store.list());
}
