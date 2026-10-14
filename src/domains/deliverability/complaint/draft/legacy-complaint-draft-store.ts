import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyComplaintDraft } from "./legacy-complaint-draft.js";

/** Keeps legacy complaint drafts by code. */
export interface LegacyComplaintDraftStore {
  find(code: string): LegacyComplaintDraft | undefined;
  save(item: LegacyComplaintDraft): void;
  remove(code: string): boolean;
  list(): LegacyComplaintDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyComplaintDraftStore implements LegacyComplaintDraftStore {
  items: Map<string, LegacyComplaintDraft>;
  order: string[];

  constructor(items: Map<string, LegacyComplaintDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyComplaintDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyComplaintDraft): void {
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

  list(): LegacyComplaintDraft[] {
    const out: LegacyComplaintDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyComplaintDraftStore(): LegacyComplaintDraftStore {
  return new MemoryLegacyComplaintDraftStore(new Map<string, LegacyComplaintDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyComplaintDraftStore implements LegacyComplaintDraftStore {
  inner: LegacyComplaintDraftStore;
  cache: cache.TtlCache<LegacyComplaintDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyComplaintDraftStore,
    cacheValue: cache.TtlCache<LegacyComplaintDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyComplaintDraft | undefined {
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

  save(item: LegacyComplaintDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyComplaintDraft[] {
    return this.inner.list();
  }
}

export function newCachedLegacyComplaintDraftStore(inner: LegacyComplaintDraftStore, ttl: number, clockValue: clock.Clock): LegacyComplaintDraftStore {
  return new CachedLegacyComplaintDraftStore(
    inner,
    cache.newTtlCache<LegacyComplaintDraft>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy complaint drafts. Empty fields match all. */
export class LegacyComplaintDraftQuery {
  utmSource: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minOpenRate: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyComplaintDraft): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyComplaintDraft[]): LegacyComplaintDraft[] {
    const matched = collections.filter(items, (candidate: LegacyComplaintDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyComplaintDrafts(store: LegacyComplaintDraftStore, query: LegacyComplaintDraftQuery): LegacyComplaintDraft[] {
  return query.apply(store.list());
}
