import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FunnelDraft } from "./funnel-draft.js";

/** Keeps funnel drafts by code. */
export interface FunnelDraftStore {
  find(code: string): FunnelDraft | undefined;
  save(item: FunnelDraft): void;
  remove(code: string): boolean;
  list(): FunnelDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFunnelDraftStore implements FunnelDraftStore {
  items: Map<string, FunnelDraft>;
  order: string[];

  constructor(items: Map<string, FunnelDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FunnelDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FunnelDraft): void {
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

  list(): FunnelDraft[] {
    const out: FunnelDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFunnelDraftStore(): FunnelDraftStore {
  return new MemoryFunnelDraftStore(new Map<string, FunnelDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFunnelDraftStore implements FunnelDraftStore {
  inner: FunnelDraftStore;
  cache: cache.TtlCache<FunnelDraft>;
  hits: number;
  misses: number;

  constructor(inner: FunnelDraftStore, cacheValue: cache.TtlCache<FunnelDraft>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FunnelDraft | undefined {
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

  save(item: FunnelDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FunnelDraft[] {
    return this.inner.list();
  }
}

export function newCachedFunnelDraftStore(inner: FunnelDraftStore, ttl: number, clockValue: clock.Clock): FunnelDraftStore {
  return new CachedFunnelDraftStore(inner, cache.newTtlCache<FunnelDraft>(512, ttl, clockValue), 0, 0);
}

/** Selects funnel drafts. Empty fields match all. */
export class FunnelDraftQuery {
  unit: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minThreshold: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FunnelDraft): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FunnelDraft[]): FunnelDraft[] {
    const matched = collections.filter(items, (candidate: FunnelDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFunnelDrafts(store: FunnelDraftStore, query: FunnelDraftQuery): FunnelDraft[] {
  return query.apply(store.list());
}
