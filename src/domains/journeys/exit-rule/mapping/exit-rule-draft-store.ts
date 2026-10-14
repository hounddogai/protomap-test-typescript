import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ExitRuleDraft } from "./exit-rule-draft.js";

/** Keeps exit rule drafts by code. */
export interface ExitRuleDraftStore {
  find(code: string): ExitRuleDraft | undefined;
  save(item: ExitRuleDraft): void;
  remove(code: string): boolean;
  list(): ExitRuleDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryExitRuleDraftStore implements ExitRuleDraftStore {
  items: Map<string, ExitRuleDraft>;
  order: string[];

  constructor(items: Map<string, ExitRuleDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ExitRuleDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ExitRuleDraft): void {
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

  list(): ExitRuleDraft[] {
    const out: ExitRuleDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryExitRuleDraftStore(): ExitRuleDraftStore {
  return new MemoryExitRuleDraftStore(new Map<string, ExitRuleDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedExitRuleDraftStore implements ExitRuleDraftStore {
  inner: ExitRuleDraftStore;
  cache: cache.TtlCache<ExitRuleDraft>;
  hits: number;
  misses: number;

  constructor(inner: ExitRuleDraftStore, cacheValue: cache.TtlCache<ExitRuleDraft>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ExitRuleDraft | undefined {
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

  save(item: ExitRuleDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ExitRuleDraft[] {
    return this.inner.list();
  }
}

export function newCachedExitRuleDraftStore(inner: ExitRuleDraftStore, ttl: number, clockValue: clock.Clock): ExitRuleDraftStore {
  return new CachedExitRuleDraftStore(inner, cache.newTtlCache<ExitRuleDraft>(256, ttl, clockValue), 0, 0);
}

/** Selects exit rule drafts. Empty fields match all. */
export class ExitRuleDraftQuery {
  locale: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minAttempts: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ExitRuleDraft): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ExitRuleDraft[]): ExitRuleDraft[] {
    const matched = collections.filter(items, (candidate: ExitRuleDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findExitRuleDrafts(store: ExitRuleDraftStore, query: ExitRuleDraftQuery): ExitRuleDraft[] {
  return query.apply(store.list());
}
