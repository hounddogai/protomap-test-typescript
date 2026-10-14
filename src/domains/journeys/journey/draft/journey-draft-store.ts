import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { JourneyDraft } from "./journey-draft.js";

/** Keeps journey drafts by code. */
export interface JourneyDraftStore {
  find(code: string): JourneyDraft | undefined;
  save(item: JourneyDraft): void;
  remove(code: string): boolean;
  list(): JourneyDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryJourneyDraftStore implements JourneyDraftStore {
  items: Map<string, JourneyDraft>;
  order: string[];

  constructor(items: Map<string, JourneyDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): JourneyDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: JourneyDraft): void {
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

  list(): JourneyDraft[] {
    const out: JourneyDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryJourneyDraftStore(): JourneyDraftStore {
  return new MemoryJourneyDraftStore(new Map<string, JourneyDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedJourneyDraftStore implements JourneyDraftStore {
  inner: JourneyDraftStore;
  cache: cache.TtlCache<JourneyDraft>;
  hits: number;
  misses: number;

  constructor(inner: JourneyDraftStore, cacheValue: cache.TtlCache<JourneyDraft>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): JourneyDraft | undefined {
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

  save(item: JourneyDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): JourneyDraft[] {
    return this.inner.list();
  }
}

export function newCachedJourneyDraftStore(inner: JourneyDraftStore, ttl: number, clockValue: clock.Clock): JourneyDraftStore {
  return new CachedJourneyDraftStore(inner, cache.newTtlCache<JourneyDraft>(1024, ttl, clockValue), 0, 0);
}

/** Selects journey drafts. Empty fields match all. */
export class JourneyDraftQuery {
  channel: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: JourneyDraft): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: JourneyDraft[]): JourneyDraft[] {
    const matched = collections.filter(items, (candidate: JourneyDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findJourneyDrafts(store: JourneyDraftStore, query: JourneyDraftQuery): JourneyDraft[] {
  return query.apply(store.list());
}
