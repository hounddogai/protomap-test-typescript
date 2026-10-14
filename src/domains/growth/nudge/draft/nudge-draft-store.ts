import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { NudgeDraft } from "./nudge-draft.js";

/** Keeps nudge drafts by code. */
export interface NudgeDraftStore {
  find(code: string): NudgeDraft | undefined;
  save(item: NudgeDraft): void;
  remove(code: string): boolean;
  list(): NudgeDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryNudgeDraftStore implements NudgeDraftStore {
  items: Map<string, NudgeDraft>;
  order: string[];

  constructor(items: Map<string, NudgeDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): NudgeDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: NudgeDraft): void {
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

  list(): NudgeDraft[] {
    const out: NudgeDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryNudgeDraftStore(): NudgeDraftStore {
  return new MemoryNudgeDraftStore(new Map<string, NudgeDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedNudgeDraftStore implements NudgeDraftStore {
  inner: NudgeDraftStore;
  cache: cache.TtlCache<NudgeDraft>;
  hits: number;
  misses: number;

  constructor(inner: NudgeDraftStore, cacheValue: cache.TtlCache<NudgeDraft>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): NudgeDraft | undefined {
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

  save(item: NudgeDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): NudgeDraft[] {
    return this.inner.list();
  }
}

export function newCachedNudgeDraftStore(inner: NudgeDraftStore, ttl: number, clockValue: clock.Clock): NudgeDraftStore {
  return new CachedNudgeDraftStore(inner, cache.newTtlCache<NudgeDraft>(1024, ttl, clockValue), 0, 0);
}

/** Selects nudge drafts. Empty fields match all. */
export class NudgeDraftQuery {
  title: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minBudget: number, statuses: string[], limit: number) {
    this.title = title;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: NudgeDraft): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: NudgeDraft[]): NudgeDraft[] {
    const matched = collections.filter(items, (candidate: NudgeDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findNudgeDrafts(store: NudgeDraftStore, query: NudgeDraftQuery): NudgeDraft[] {
  return query.apply(store.list());
}
