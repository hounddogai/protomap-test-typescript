import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualProofDraft } from "./manual-proof-draft.js";

/** Keeps manual proof drafts by code. */
export interface ManualProofDraftStore {
  find(code: string): ManualProofDraft | undefined;
  save(item: ManualProofDraft): void;
  remove(code: string): boolean;
  list(): ManualProofDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualProofDraftStore implements ManualProofDraftStore {
  items: Map<string, ManualProofDraft>;
  order: string[];

  constructor(items: Map<string, ManualProofDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualProofDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualProofDraft): void {
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

  list(): ManualProofDraft[] {
    const out: ManualProofDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualProofDraftStore(): ManualProofDraftStore {
  return new MemoryManualProofDraftStore(new Map<string, ManualProofDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualProofDraftStore implements ManualProofDraftStore {
  inner: ManualProofDraftStore;
  cache: cache.TtlCache<ManualProofDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualProofDraftStore,
    cacheValue: cache.TtlCache<ManualProofDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualProofDraft | undefined {
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

  save(item: ManualProofDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualProofDraft[] {
    return this.inner.list();
  }
}

export function newCachedManualProofDraftStore(inner: ManualProofDraftStore, ttl: number, clockValue: clock.Clock): ManualProofDraftStore {
  return new CachedManualProofDraftStore(inner, cache.newTtlCache<ManualProofDraft>(512, ttl, clockValue), 0, 0);
}

/** Selects manual proof drafts. Empty fields match all. */
export class ManualProofDraftQuery {
  label: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRevision: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualProofDraft): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualProofDraft[]): ManualProofDraft[] {
    const matched = collections.filter(items, (candidate: ManualProofDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualProofDrafts(store: ManualProofDraftStore, query: ManualProofDraftQuery): ManualProofDraft[] {
  return query.apply(store.list());
}
