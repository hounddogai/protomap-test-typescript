import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InviteSummary } from "./invite-summary.js";

/** Keeps invite summaries by code. */
export interface InviteSummaryStore {
  find(code: string): InviteSummary | undefined;
  save(item: InviteSummary): void;
  remove(code: string): boolean;
  list(): InviteSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInviteSummaryStore implements InviteSummaryStore {
  items: Map<string, InviteSummary>;
  order: string[];

  constructor(items: Map<string, InviteSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InviteSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InviteSummary): void {
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

  list(): InviteSummary[] {
    const out: InviteSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInviteSummaryStore(): InviteSummaryStore {
  return new MemoryInviteSummaryStore(new Map<string, InviteSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInviteSummaryStore implements InviteSummaryStore {
  inner: InviteSummaryStore;
  cache: cache.TtlCache<InviteSummary>;
  hits: number;
  misses: number;

  constructor(inner: InviteSummaryStore, cacheValue: cache.TtlCache<InviteSummary>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InviteSummary | undefined {
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

  save(item: InviteSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InviteSummary[] {
    return this.inner.list();
  }
}

export function newCachedInviteSummaryStore(inner: InviteSummaryStore, ttl: number, clockValue: clock.Clock): InviteSummaryStore {
  return new CachedInviteSummaryStore(inner, cache.newTtlCache<InviteSummary>(1024, ttl, clockValue), 0, 0);
}

/** Selects invite summaries. Empty fields match all. */
export class InviteSummaryQuery {
  segment: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minRatio: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InviteSummary): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InviteSummary[]): InviteSummary[] {
    const matched = collections.filter(items, (candidate: InviteSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInviteSummaries(store: InviteSummaryStore, query: InviteSummaryQuery): InviteSummary[] {
  return query.apply(store.list());
}
