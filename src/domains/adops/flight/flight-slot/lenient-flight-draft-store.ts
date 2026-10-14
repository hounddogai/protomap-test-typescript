import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientFlightDraft } from "./lenient-flight-draft.js";

/** Keeps lenient flight drafts by code. */
export interface LenientFlightDraftStore {
  find(code: string): LenientFlightDraft | undefined;
  save(item: LenientFlightDraft): void;
  remove(code: string): boolean;
  list(): LenientFlightDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientFlightDraftStore implements LenientFlightDraftStore {
  items: Map<string, LenientFlightDraft>;
  order: string[];

  constructor(items: Map<string, LenientFlightDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientFlightDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientFlightDraft): void {
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

  list(): LenientFlightDraft[] {
    const out: LenientFlightDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientFlightDraftStore(): LenientFlightDraftStore {
  return new MemoryLenientFlightDraftStore(new Map<string, LenientFlightDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientFlightDraftStore implements LenientFlightDraftStore {
  inner: LenientFlightDraftStore;
  cache: cache.TtlCache<LenientFlightDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientFlightDraftStore,
    cacheValue: cache.TtlCache<LenientFlightDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientFlightDraft | undefined {
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

  save(item: LenientFlightDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientFlightDraft[] {
    return this.inner.list();
  }
}

export function newCachedLenientFlightDraftStore(inner: LenientFlightDraftStore, ttl: number, clockValue: clock.Clock): LenientFlightDraftStore {
  return new CachedLenientFlightDraftStore(inner, cache.newTtlCache<LenientFlightDraft>(1024, ttl, clockValue), 0, 0);
}

/** Selects lenient flight drafts. Empty fields match all. */
export class LenientFlightDraftQuery {
  channel: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCeiling: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientFlightDraft): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientFlightDraft[]): LenientFlightDraft[] {
    const matched = collections.filter(items, (candidate: LenientFlightDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientFlightDrafts(store: LenientFlightDraftStore, query: LenientFlightDraftQuery): LenientFlightDraft[] {
  return query.apply(store.list());
}
