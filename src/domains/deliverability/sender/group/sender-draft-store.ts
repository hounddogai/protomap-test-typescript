import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SenderDraft } from "./sender-draft.js";

/** Keeps sender drafts by code. */
export interface SenderDraftStore {
  find(code: string): SenderDraft | undefined;
  save(item: SenderDraft): void;
  remove(code: string): boolean;
  list(): SenderDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySenderDraftStore implements SenderDraftStore {
  items: Map<string, SenderDraft>;
  order: string[];

  constructor(items: Map<string, SenderDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SenderDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SenderDraft): void {
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

  list(): SenderDraft[] {
    const out: SenderDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySenderDraftStore(): SenderDraftStore {
  return new MemorySenderDraftStore(new Map<string, SenderDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSenderDraftStore implements SenderDraftStore {
  inner: SenderDraftStore;
  cache: cache.TtlCache<SenderDraft>;
  hits: number;
  misses: number;

  constructor(inner: SenderDraftStore, cacheValue: cache.TtlCache<SenderDraft>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SenderDraft | undefined {
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

  save(item: SenderDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SenderDraft[] {
    return this.inner.list();
  }
}

export function newCachedSenderDraftStore(inner: SenderDraftStore, ttl: number, clockValue: clock.Clock): SenderDraftStore {
  return new CachedSenderDraftStore(inner, cache.newTtlCache<SenderDraft>(1024, ttl, clockValue), 0, 0);
}

/** Selects sender drafts. Empty fields match all. */
export class SenderDraftQuery {
  label: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.label = label;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SenderDraft): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SenderDraft[]): SenderDraft[] {
    const matched = collections.filter(items, (candidate: SenderDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSenderDrafts(store: SenderDraftStore, query: SenderDraftQuery): SenderDraft[] {
  return query.apply(store.list());
}
