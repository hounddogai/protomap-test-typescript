import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalComplaintDraft } from "./regional-complaint-draft.js";

/** Keeps regional complaint drafts by code. */
export interface RegionalComplaintDraftStore {
  find(code: string): RegionalComplaintDraft | undefined;
  save(item: RegionalComplaintDraft): void;
  remove(code: string): boolean;
  list(): RegionalComplaintDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalComplaintDraftStore implements RegionalComplaintDraftStore {
  items: Map<string, RegionalComplaintDraft>;
  order: string[];

  constructor(items: Map<string, RegionalComplaintDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalComplaintDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalComplaintDraft): void {
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

  list(): RegionalComplaintDraft[] {
    const out: RegionalComplaintDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalComplaintDraftStore(): RegionalComplaintDraftStore {
  return new MemoryRegionalComplaintDraftStore(new Map<string, RegionalComplaintDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalComplaintDraftStore implements RegionalComplaintDraftStore {
  inner: RegionalComplaintDraftStore;
  cache: cache.TtlCache<RegionalComplaintDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalComplaintDraftStore,
    cacheValue: cache.TtlCache<RegionalComplaintDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalComplaintDraft | undefined {
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

  save(item: RegionalComplaintDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalComplaintDraft[] {
    return this.inner.list();
  }
}

export function newCachedRegionalComplaintDraftStore(inner: RegionalComplaintDraftStore, ttl: number, clockValue: clock.Clock): RegionalComplaintDraftStore {
  return new CachedRegionalComplaintDraftStore(
    inner,
    cache.newTtlCache<RegionalComplaintDraft>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional complaint drafts. Empty fields match all. */
export class RegionalComplaintDraftQuery {
  locale: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minFloorValue: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalComplaintDraft): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalComplaintDraft[]): RegionalComplaintDraft[] {
    const matched = collections.filter(items, (candidate: RegionalComplaintDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalComplaintDrafts(store: RegionalComplaintDraftStore, query: RegionalComplaintDraftQuery): RegionalComplaintDraft[] {
  return query.apply(store.list());
}
