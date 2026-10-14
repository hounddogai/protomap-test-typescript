import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultFrequencyDraft } from "./default-frequency-draft.js";

/** Keeps default frequency drafts by code. */
export interface DefaultFrequencyDraftStore {
  find(code: string): DefaultFrequencyDraft | undefined;
  save(item: DefaultFrequencyDraft): void;
  remove(code: string): boolean;
  list(): DefaultFrequencyDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultFrequencyDraftStore implements DefaultFrequencyDraftStore {
  items: Map<string, DefaultFrequencyDraft>;
  order: string[];

  constructor(items: Map<string, DefaultFrequencyDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultFrequencyDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultFrequencyDraft): void {
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

  list(): DefaultFrequencyDraft[] {
    const out: DefaultFrequencyDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultFrequencyDraftStore(): DefaultFrequencyDraftStore {
  return new MemoryDefaultFrequencyDraftStore(new Map<string, DefaultFrequencyDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultFrequencyDraftStore implements DefaultFrequencyDraftStore {
  inner: DefaultFrequencyDraftStore;
  cache: cache.TtlCache<DefaultFrequencyDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultFrequencyDraftStore,
    cacheValue: cache.TtlCache<DefaultFrequencyDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultFrequencyDraft | undefined {
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

  save(item: DefaultFrequencyDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultFrequencyDraft[] {
    return this.inner.list();
  }
}

export function newCachedDefaultFrequencyDraftStore(inner: DefaultFrequencyDraftStore, ttl: number, clockValue: clock.Clock): DefaultFrequencyDraftStore {
  return new CachedDefaultFrequencyDraftStore(
    inner,
    cache.newTtlCache<DefaultFrequencyDraft>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default frequency drafts. Empty fields match all. */
export class DefaultFrequencyDraftQuery {
  source: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minQuantity: number, statuses: string[], limit: number) {
    this.source = source;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultFrequencyDraft): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultFrequencyDraft[]): DefaultFrequencyDraft[] {
    const matched = collections.filter(items, (candidate: DefaultFrequencyDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultFrequencyDrafts(store: DefaultFrequencyDraftStore, query: DefaultFrequencyDraftQuery): DefaultFrequencyDraft[] {
  return query.apply(store.list());
}
