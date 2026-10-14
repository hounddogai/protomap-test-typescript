import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PreferenceDraft } from "./preference-draft.js";

/** Keeps preference drafts by code. */
export interface PreferenceDraftStore {
  find(code: string): PreferenceDraft | undefined;
  save(item: PreferenceDraft): void;
  remove(code: string): boolean;
  list(): PreferenceDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPreferenceDraftStore implements PreferenceDraftStore {
  items: Map<string, PreferenceDraft>;
  order: string[];

  constructor(items: Map<string, PreferenceDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PreferenceDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PreferenceDraft): void {
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

  list(): PreferenceDraft[] {
    const out: PreferenceDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPreferenceDraftStore(): PreferenceDraftStore {
  return new MemoryPreferenceDraftStore(new Map<string, PreferenceDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPreferenceDraftStore implements PreferenceDraftStore {
  inner: PreferenceDraftStore;
  cache: cache.TtlCache<PreferenceDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: PreferenceDraftStore,
    cacheValue: cache.TtlCache<PreferenceDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PreferenceDraft | undefined {
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

  save(item: PreferenceDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PreferenceDraft[] {
    return this.inner.list();
  }
}

export function newCachedPreferenceDraftStore(inner: PreferenceDraftStore, ttl: number, clockValue: clock.Clock): PreferenceDraftStore {
  return new CachedPreferenceDraftStore(inner, cache.newTtlCache<PreferenceDraft>(256, ttl, clockValue), 0, 0);
}

/** Selects preference drafts. Empty fields match all. */
export class PreferenceDraftQuery {
  label: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCost: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PreferenceDraft): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PreferenceDraft[]): PreferenceDraft[] {
    const matched = collections.filter(items, (candidate: PreferenceDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPreferenceDrafts(store: PreferenceDraftStore, query: PreferenceDraftQuery): PreferenceDraft[] {
  return query.apply(store.list());
}
