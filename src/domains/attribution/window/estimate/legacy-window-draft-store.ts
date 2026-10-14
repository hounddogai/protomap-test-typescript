import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyWindowDraft } from "./legacy-window-draft.js";

/** Keeps legacy window drafts by code. */
export interface LegacyWindowDraftStore {
  find(code: string): LegacyWindowDraft | undefined;
  save(item: LegacyWindowDraft): void;
  remove(code: string): boolean;
  list(): LegacyWindowDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyWindowDraftStore implements LegacyWindowDraftStore {
  items: Map<string, LegacyWindowDraft>;
  order: string[];

  constructor(items: Map<string, LegacyWindowDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyWindowDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyWindowDraft): void {
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

  list(): LegacyWindowDraft[] {
    const out: LegacyWindowDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyWindowDraftStore(): LegacyWindowDraftStore {
  return new MemoryLegacyWindowDraftStore(new Map<string, LegacyWindowDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyWindowDraftStore implements LegacyWindowDraftStore {
  inner: LegacyWindowDraftStore;
  cache: cache.TtlCache<LegacyWindowDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyWindowDraftStore,
    cacheValue: cache.TtlCache<LegacyWindowDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyWindowDraft | undefined {
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

  save(item: LegacyWindowDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyWindowDraft[] {
    return this.inner.list();
  }
}

export function newCachedLegacyWindowDraftStore(inner: LegacyWindowDraftStore, ttl: number, clockValue: clock.Clock): LegacyWindowDraftStore {
  return new CachedLegacyWindowDraftStore(inner, cache.newTtlCache<LegacyWindowDraft>(64, ttl, clockValue), 0, 0);
}

/** Selects legacy window drafts. Empty fields match all. */
export class LegacyWindowDraftQuery {
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

  matches(item: LegacyWindowDraft): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyWindowDraft[]): LegacyWindowDraft[] {
    const matched = collections.filter(items, (candidate: LegacyWindowDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyWindowDrafts(store: LegacyWindowDraftStore, query: LegacyWindowDraftQuery): LegacyWindowDraft[] {
  return query.apply(store.list());
}
