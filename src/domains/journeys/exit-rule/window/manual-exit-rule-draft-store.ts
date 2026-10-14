import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualExitRuleDraft } from "./manual-exit-rule-draft.js";

/** Keeps manual exit rule drafts by code. */
export interface ManualExitRuleDraftStore {
  find(code: string): ManualExitRuleDraft | undefined;
  save(item: ManualExitRuleDraft): void;
  remove(code: string): boolean;
  list(): ManualExitRuleDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualExitRuleDraftStore implements ManualExitRuleDraftStore {
  items: Map<string, ManualExitRuleDraft>;
  order: string[];

  constructor(items: Map<string, ManualExitRuleDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualExitRuleDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualExitRuleDraft): void {
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

  list(): ManualExitRuleDraft[] {
    const out: ManualExitRuleDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualExitRuleDraftStore(): ManualExitRuleDraftStore {
  return new MemoryManualExitRuleDraftStore(new Map<string, ManualExitRuleDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualExitRuleDraftStore implements ManualExitRuleDraftStore {
  inner: ManualExitRuleDraftStore;
  cache: cache.TtlCache<ManualExitRuleDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualExitRuleDraftStore,
    cacheValue: cache.TtlCache<ManualExitRuleDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualExitRuleDraft | undefined {
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

  save(item: ManualExitRuleDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualExitRuleDraft[] {
    return this.inner.list();
  }
}

export function newCachedManualExitRuleDraftStore(inner: ManualExitRuleDraftStore, ttl: number, clockValue: clock.Clock): ManualExitRuleDraftStore {
  return new CachedManualExitRuleDraftStore(inner, cache.newTtlCache<ManualExitRuleDraft>(256, ttl, clockValue), 0, 0);
}

/** Selects manual exit rule drafts. Empty fields match all. */
export class ManualExitRuleDraftQuery {
  title: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMargin: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualExitRuleDraft): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualExitRuleDraft[]): ManualExitRuleDraft[] {
    const matched = collections.filter(items, (candidate: ManualExitRuleDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualExitRuleDrafts(store: ManualExitRuleDraftStore, query: ManualExitRuleDraftQuery): ManualExitRuleDraft[] {
  return query.apply(store.list());
}
