import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FrequencyDraft } from "./frequency-draft.js";

/** Keeps frequency drafts by code. */
export interface FrequencyDraftStore {
  find(code: string): FrequencyDraft | undefined;
  save(item: FrequencyDraft): void;
  remove(code: string): boolean;
  list(): FrequencyDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFrequencyDraftStore implements FrequencyDraftStore {
  items: Map<string, FrequencyDraft>;
  order: string[];

  constructor(items: Map<string, FrequencyDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FrequencyDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FrequencyDraft): void {
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

  list(): FrequencyDraft[] {
    const out: FrequencyDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFrequencyDraftStore(): FrequencyDraftStore {
  return new MemoryFrequencyDraftStore(new Map<string, FrequencyDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFrequencyDraftStore implements FrequencyDraftStore {
  inner: FrequencyDraftStore;
  cache: cache.TtlCache<FrequencyDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: FrequencyDraftStore,
    cacheValue: cache.TtlCache<FrequencyDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FrequencyDraft | undefined {
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

  save(item: FrequencyDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FrequencyDraft[] {
    return this.inner.list();
  }
}

export function newCachedFrequencyDraftStore(inner: FrequencyDraftStore, ttl: number, clockValue: clock.Clock): FrequencyDraftStore {
  return new CachedFrequencyDraftStore(inner, cache.newTtlCache<FrequencyDraft>(512, ttl, clockValue), 0, 0);
}

/** Selects frequency drafts. Empty fields match all. */
export class FrequencyDraftQuery {
  name: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FrequencyDraft): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FrequencyDraft[]): FrequencyDraft[] {
    const matched = collections.filter(items, (candidate: FrequencyDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFrequencyDrafts(store: FrequencyDraftStore, query: FrequencyDraftQuery): FrequencyDraft[] {
  return query.apply(store.list());
}
