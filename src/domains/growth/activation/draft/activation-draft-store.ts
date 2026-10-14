import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ActivationDraft } from "./activation-draft.js";

/** Keeps activation drafts by code. */
export interface ActivationDraftStore {
  find(code: string): ActivationDraft | undefined;
  save(item: ActivationDraft): void;
  remove(code: string): boolean;
  list(): ActivationDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryActivationDraftStore implements ActivationDraftStore {
  items: Map<string, ActivationDraft>;
  order: string[];

  constructor(items: Map<string, ActivationDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ActivationDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ActivationDraft): void {
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

  list(): ActivationDraft[] {
    const out: ActivationDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryActivationDraftStore(): ActivationDraftStore {
  return new MemoryActivationDraftStore(new Map<string, ActivationDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedActivationDraftStore implements ActivationDraftStore {
  inner: ActivationDraftStore;
  cache: cache.TtlCache<ActivationDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: ActivationDraftStore,
    cacheValue: cache.TtlCache<ActivationDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ActivationDraft | undefined {
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

  save(item: ActivationDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ActivationDraft[] {
    return this.inner.list();
  }
}

export function newCachedActivationDraftStore(inner: ActivationDraftStore, ttl: number, clockValue: clock.Clock): ActivationDraftStore {
  return new CachedActivationDraftStore(inner, cache.newTtlCache<ActivationDraft>(128, ttl, clockValue), 0, 0);
}

/** Selects activation drafts. Empty fields match all. */
export class ActivationDraftQuery {
  name: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minFloorValue: number, statuses: string[], limit: number) {
    this.name = name;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ActivationDraft): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ActivationDraft[]): ActivationDraft[] {
    const matched = collections.filter(items, (candidate: ActivationDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findActivationDrafts(store: ActivationDraftStore, query: ActivationDraftQuery): ActivationDraft[] {
  return query.apply(store.list());
}
