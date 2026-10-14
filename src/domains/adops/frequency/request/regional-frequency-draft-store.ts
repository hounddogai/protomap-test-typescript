import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalFrequencyDraft } from "./regional-frequency-draft.js";

/** Keeps regional frequency drafts by code. */
export interface RegionalFrequencyDraftStore {
  find(code: string): RegionalFrequencyDraft | undefined;
  save(item: RegionalFrequencyDraft): void;
  remove(code: string): boolean;
  list(): RegionalFrequencyDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalFrequencyDraftStore implements RegionalFrequencyDraftStore {
  items: Map<string, RegionalFrequencyDraft>;
  order: string[];

  constructor(items: Map<string, RegionalFrequencyDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalFrequencyDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalFrequencyDraft): void {
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

  list(): RegionalFrequencyDraft[] {
    const out: RegionalFrequencyDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalFrequencyDraftStore(): RegionalFrequencyDraftStore {
  return new MemoryRegionalFrequencyDraftStore(new Map<string, RegionalFrequencyDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalFrequencyDraftStore implements RegionalFrequencyDraftStore {
  inner: RegionalFrequencyDraftStore;
  cache: cache.TtlCache<RegionalFrequencyDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalFrequencyDraftStore,
    cacheValue: cache.TtlCache<RegionalFrequencyDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalFrequencyDraft | undefined {
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

  save(item: RegionalFrequencyDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalFrequencyDraft[] {
    return this.inner.list();
  }
}

export function newCachedRegionalFrequencyDraftStore(inner: RegionalFrequencyDraftStore, ttl: number, clockValue: clock.Clock): RegionalFrequencyDraftStore {
  return new CachedRegionalFrequencyDraftStore(
    inner,
    cache.newTtlCache<RegionalFrequencyDraft>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional frequency drafts. Empty fields match all. */
export class RegionalFrequencyDraftQuery {
  source: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minBudget: number, statuses: string[], limit: number) {
    this.source = source;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalFrequencyDraft): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalFrequencyDraft[]): RegionalFrequencyDraft[] {
    const matched = collections.filter(items, (candidate: RegionalFrequencyDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalFrequencyDrafts(store: RegionalFrequencyDraftStore, query: RegionalFrequencyDraftQuery): RegionalFrequencyDraft[] {
  return query.apply(store.list());
}
