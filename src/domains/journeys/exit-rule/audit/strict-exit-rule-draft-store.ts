import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictExitRuleDraft } from "./strict-exit-rule-draft.js";

/** Keeps strict exit rule drafts by code. */
export interface StrictExitRuleDraftStore {
  find(code: string): StrictExitRuleDraft | undefined;
  save(item: StrictExitRuleDraft): void;
  remove(code: string): boolean;
  list(): StrictExitRuleDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictExitRuleDraftStore implements StrictExitRuleDraftStore {
  items: Map<string, StrictExitRuleDraft>;
  order: string[];

  constructor(items: Map<string, StrictExitRuleDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictExitRuleDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictExitRuleDraft): void {
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

  list(): StrictExitRuleDraft[] {
    const out: StrictExitRuleDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictExitRuleDraftStore(): StrictExitRuleDraftStore {
  return new MemoryStrictExitRuleDraftStore(new Map<string, StrictExitRuleDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictExitRuleDraftStore implements StrictExitRuleDraftStore {
  inner: StrictExitRuleDraftStore;
  cache: cache.TtlCache<StrictExitRuleDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictExitRuleDraftStore,
    cacheValue: cache.TtlCache<StrictExitRuleDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictExitRuleDraft | undefined {
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

  save(item: StrictExitRuleDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictExitRuleDraft[] {
    return this.inner.list();
  }
}

export function newCachedStrictExitRuleDraftStore(inner: StrictExitRuleDraftStore, ttl: number, clockValue: clock.Clock): StrictExitRuleDraftStore {
  return new CachedStrictExitRuleDraftStore(inner, cache.newTtlCache<StrictExitRuleDraft>(512, ttl, clockValue), 0, 0);
}

/** Selects strict exit rule drafts. Empty fields match all. */
export class StrictExitRuleDraftQuery {
  title: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minVersion: number, statuses: string[], limit: number) {
    this.title = title;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictExitRuleDraft): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictExitRuleDraft[]): StrictExitRuleDraft[] {
    const matched = collections.filter(items, (candidate: StrictExitRuleDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictExitRuleDrafts(store: StrictExitRuleDraftStore, query: StrictExitRuleDraftQuery): StrictExitRuleDraft[] {
  return query.apply(store.list());
}
