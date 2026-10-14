import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { OptOutDraft } from "./opt-out-draft.js";

/** Keeps opt out drafts by code. */
export interface OptOutDraftStore {
  find(code: string): OptOutDraft | undefined;
  save(item: OptOutDraft): void;
  remove(code: string): boolean;
  list(): OptOutDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryOptOutDraftStore implements OptOutDraftStore {
  items: Map<string, OptOutDraft>;
  order: string[];

  constructor(items: Map<string, OptOutDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): OptOutDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: OptOutDraft): void {
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

  list(): OptOutDraft[] {
    const out: OptOutDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryOptOutDraftStore(): OptOutDraftStore {
  return new MemoryOptOutDraftStore(new Map<string, OptOutDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedOptOutDraftStore implements OptOutDraftStore {
  inner: OptOutDraftStore;
  cache: cache.TtlCache<OptOutDraft>;
  hits: number;
  misses: number;

  constructor(inner: OptOutDraftStore, cacheValue: cache.TtlCache<OptOutDraft>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): OptOutDraft | undefined {
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

  save(item: OptOutDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): OptOutDraft[] {
    return this.inner.list();
  }
}

export function newCachedOptOutDraftStore(inner: OptOutDraftStore, ttl: number, clockValue: clock.Clock): OptOutDraftStore {
  return new CachedOptOutDraftStore(inner, cache.newTtlCache<OptOutDraft>(512, ttl, clockValue), 0, 0);
}

/** Selects opt out drafts. Empty fields match all. */
export class OptOutDraftQuery {
  source: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minRatio: number, statuses: string[], limit: number) {
    this.source = source;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: OptOutDraft): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: OptOutDraft[]): OptOutDraft[] {
    const matched = collections.filter(items, (candidate: OptOutDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findOptOutDrafts(store: OptOutDraftStore, query: OptOutDraftQuery): OptOutDraft[] {
  return query.apply(store.list());
}
