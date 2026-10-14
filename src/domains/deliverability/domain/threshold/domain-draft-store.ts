import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DomainDraft } from "./domain-draft.js";

/** Keeps domain drafts by code. */
export interface DomainDraftStore {
  find(code: string): DomainDraft | undefined;
  save(item: DomainDraft): void;
  remove(code: string): boolean;
  list(): DomainDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDomainDraftStore implements DomainDraftStore {
  items: Map<string, DomainDraft>;
  order: string[];

  constructor(items: Map<string, DomainDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DomainDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DomainDraft): void {
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

  list(): DomainDraft[] {
    const out: DomainDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDomainDraftStore(): DomainDraftStore {
  return new MemoryDomainDraftStore(new Map<string, DomainDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDomainDraftStore implements DomainDraftStore {
  inner: DomainDraftStore;
  cache: cache.TtlCache<DomainDraft>;
  hits: number;
  misses: number;

  constructor(inner: DomainDraftStore, cacheValue: cache.TtlCache<DomainDraft>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DomainDraft | undefined {
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

  save(item: DomainDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DomainDraft[] {
    return this.inner.list();
  }
}

export function newCachedDomainDraftStore(inner: DomainDraftStore, ttl: number, clockValue: clock.Clock): DomainDraftStore {
  return new CachedDomainDraftStore(inner, cache.newTtlCache<DomainDraft>(256, ttl, clockValue), 0, 0);
}

/** Selects domain drafts. Empty fields match all. */
export class DomainDraftQuery {
  region: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.region = region;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DomainDraft): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DomainDraft[]): DomainDraft[] {
    const matched = collections.filter(items, (candidate: DomainDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDomainDrafts(store: DomainDraftStore, query: DomainDraftQuery): DomainDraft[] {
  return query.apply(store.list());
}
