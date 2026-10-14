import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalRedemptionDraft } from "./regional-redemption-draft.js";

/** Keeps regional redemption drafts by code. */
export interface RegionalRedemptionDraftStore {
  find(code: string): RegionalRedemptionDraft | undefined;
  save(item: RegionalRedemptionDraft): void;
  remove(code: string): boolean;
  list(): RegionalRedemptionDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalRedemptionDraftStore implements RegionalRedemptionDraftStore {
  items: Map<string, RegionalRedemptionDraft>;
  order: string[];

  constructor(items: Map<string, RegionalRedemptionDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalRedemptionDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalRedemptionDraft): void {
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

  list(): RegionalRedemptionDraft[] {
    const out: RegionalRedemptionDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalRedemptionDraftStore(): RegionalRedemptionDraftStore {
  return new MemoryRegionalRedemptionDraftStore(new Map<string, RegionalRedemptionDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalRedemptionDraftStore implements RegionalRedemptionDraftStore {
  inner: RegionalRedemptionDraftStore;
  cache: cache.TtlCache<RegionalRedemptionDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalRedemptionDraftStore,
    cacheValue: cache.TtlCache<RegionalRedemptionDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalRedemptionDraft | undefined {
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

  save(item: RegionalRedemptionDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalRedemptionDraft[] {
    return this.inner.list();
  }
}

export function newCachedRegionalRedemptionDraftStore(inner: RegionalRedemptionDraftStore, ttl: number, clockValue: clock.Clock): RegionalRedemptionDraftStore {
  return new CachedRegionalRedemptionDraftStore(
    inner,
    cache.newTtlCache<RegionalRedemptionDraft>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional redemption drafts. Empty fields match all. */
export class RegionalRedemptionDraftQuery {
  label: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minSequence: number, statuses: string[], limit: number) {
    this.label = label;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalRedemptionDraft): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalRedemptionDraft[]): RegionalRedemptionDraft[] {
    const matched = collections.filter(items, (candidate: RegionalRedemptionDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalRedemptionDrafts(store: RegionalRedemptionDraftStore, query: RegionalRedemptionDraftQuery): RegionalRedemptionDraft[] {
  return query.apply(store.list());
}
