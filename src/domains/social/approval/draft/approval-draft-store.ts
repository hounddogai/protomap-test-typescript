import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ApprovalDraft } from "./approval-draft.js";

/** Keeps approval drafts by code. */
export interface ApprovalDraftStore {
  find(code: string): ApprovalDraft | undefined;
  save(item: ApprovalDraft): void;
  remove(code: string): boolean;
  list(): ApprovalDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryApprovalDraftStore implements ApprovalDraftStore {
  items: Map<string, ApprovalDraft>;
  order: string[];

  constructor(items: Map<string, ApprovalDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ApprovalDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ApprovalDraft): void {
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

  list(): ApprovalDraft[] {
    const out: ApprovalDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryApprovalDraftStore(): ApprovalDraftStore {
  return new MemoryApprovalDraftStore(new Map<string, ApprovalDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedApprovalDraftStore implements ApprovalDraftStore {
  inner: ApprovalDraftStore;
  cache: cache.TtlCache<ApprovalDraft>;
  hits: number;
  misses: number;

  constructor(inner: ApprovalDraftStore, cacheValue: cache.TtlCache<ApprovalDraft>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ApprovalDraft | undefined {
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

  save(item: ApprovalDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ApprovalDraft[] {
    return this.inner.list();
  }
}

export function newCachedApprovalDraftStore(inner: ApprovalDraftStore, ttl: number, clockValue: clock.Clock): ApprovalDraftStore {
  return new CachedApprovalDraftStore(inner, cache.newTtlCache<ApprovalDraft>(64, ttl, clockValue), 0, 0);
}

/** Selects approval drafts. Empty fields match all. */
export class ApprovalDraftQuery {
  title: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minFloorValue: number, statuses: string[], limit: number) {
    this.title = title;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ApprovalDraft): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ApprovalDraft[]): ApprovalDraft[] {
    const matched = collections.filter(items, (candidate: ApprovalDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findApprovalDrafts(store: ApprovalDraftStore, query: ApprovalDraftQuery): ApprovalDraft[] {
  return query.apply(store.list());
}
