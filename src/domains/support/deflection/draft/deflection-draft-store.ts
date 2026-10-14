import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DeflectionDraft } from "./deflection-draft.js";

/** Keeps deflection drafts by code. */
export interface DeflectionDraftStore {
  find(code: string): DeflectionDraft | undefined;
  save(item: DeflectionDraft): void;
  remove(code: string): boolean;
  list(): DeflectionDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDeflectionDraftStore implements DeflectionDraftStore {
  items: Map<string, DeflectionDraft>;
  order: string[];

  constructor(items: Map<string, DeflectionDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DeflectionDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DeflectionDraft): void {
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

  list(): DeflectionDraft[] {
    const out: DeflectionDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDeflectionDraftStore(): DeflectionDraftStore {
  return new MemoryDeflectionDraftStore(new Map<string, DeflectionDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDeflectionDraftStore implements DeflectionDraftStore {
  inner: DeflectionDraftStore;
  cache: cache.TtlCache<DeflectionDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: DeflectionDraftStore,
    cacheValue: cache.TtlCache<DeflectionDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DeflectionDraft | undefined {
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

  save(item: DeflectionDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DeflectionDraft[] {
    return this.inner.list();
  }
}

export function newCachedDeflectionDraftStore(inner: DeflectionDraftStore, ttl: number, clockValue: clock.Clock): DeflectionDraftStore {
  return new CachedDeflectionDraftStore(inner, cache.newTtlCache<DeflectionDraft>(512, ttl, clockValue), 0, 0);
}

/** Selects deflection drafts. Empty fields match all. */
export class DeflectionDraftQuery {
  channel: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minLimit: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DeflectionDraft): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DeflectionDraft[]): DeflectionDraft[] {
    const matched = collections.filter(items, (candidate: DeflectionDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDeflectionDrafts(store: DeflectionDraftStore, query: DeflectionDraftQuery): DeflectionDraft[] {
  return query.apply(store.list());
}
