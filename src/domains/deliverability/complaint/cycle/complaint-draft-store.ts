import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ComplaintDraft } from "./complaint-draft.js";

/** Keeps complaint drafts by code. */
export interface ComplaintDraftStore {
  find(code: string): ComplaintDraft | undefined;
  save(item: ComplaintDraft): void;
  remove(code: string): boolean;
  list(): ComplaintDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryComplaintDraftStore implements ComplaintDraftStore {
  items: Map<string, ComplaintDraft>;
  order: string[];

  constructor(items: Map<string, ComplaintDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ComplaintDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ComplaintDraft): void {
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

  list(): ComplaintDraft[] {
    const out: ComplaintDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryComplaintDraftStore(): ComplaintDraftStore {
  return new MemoryComplaintDraftStore(new Map<string, ComplaintDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedComplaintDraftStore implements ComplaintDraftStore {
  inner: ComplaintDraftStore;
  cache: cache.TtlCache<ComplaintDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: ComplaintDraftStore,
    cacheValue: cache.TtlCache<ComplaintDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ComplaintDraft | undefined {
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

  save(item: ComplaintDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ComplaintDraft[] {
    return this.inner.list();
  }
}

export function newCachedComplaintDraftStore(inner: ComplaintDraftStore, ttl: number, clockValue: clock.Clock): ComplaintDraftStore {
  return new CachedComplaintDraftStore(inner, cache.newTtlCache<ComplaintDraft>(256, ttl, clockValue), 0, 0);
}

/** Selects complaint drafts. Empty fields match all. */
export class ComplaintDraftQuery {
  name: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minOpenRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ComplaintDraft): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ComplaintDraft[]): ComplaintDraft[] {
    const matched = collections.filter(items, (candidate: ComplaintDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findComplaintDrafts(store: ComplaintDraftStore, query: ComplaintDraftQuery): ComplaintDraft[] {
  return query.apply(store.list());
}
