import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualApprovalDraft } from "./manual-approval-draft.js";

/** Keeps manual approval drafts by code. */
export interface ManualApprovalDraftStore {
  find(code: string): ManualApprovalDraft | undefined;
  save(item: ManualApprovalDraft): void;
  remove(code: string): boolean;
  list(): ManualApprovalDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualApprovalDraftStore implements ManualApprovalDraftStore {
  items: Map<string, ManualApprovalDraft>;
  order: string[];

  constructor(items: Map<string, ManualApprovalDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualApprovalDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualApprovalDraft): void {
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

  list(): ManualApprovalDraft[] {
    const out: ManualApprovalDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualApprovalDraftStore(): ManualApprovalDraftStore {
  return new MemoryManualApprovalDraftStore(new Map<string, ManualApprovalDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualApprovalDraftStore implements ManualApprovalDraftStore {
  inner: ManualApprovalDraftStore;
  cache: cache.TtlCache<ManualApprovalDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualApprovalDraftStore,
    cacheValue: cache.TtlCache<ManualApprovalDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualApprovalDraft | undefined {
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

  save(item: ManualApprovalDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualApprovalDraft[] {
    return this.inner.list();
  }
}

export function newCachedManualApprovalDraftStore(inner: ManualApprovalDraftStore, ttl: number, clockValue: clock.Clock): ManualApprovalDraftStore {
  return new CachedManualApprovalDraftStore(inner, cache.newTtlCache<ManualApprovalDraft>(128, ttl, clockValue), 0, 0);
}

/** Selects manual approval drafts. Empty fields match all. */
export class ManualApprovalDraftQuery {
  channel: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRatio: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualApprovalDraft): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualApprovalDraft[]): ManualApprovalDraft[] {
    const matched = collections.filter(items, (candidate: ManualApprovalDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualApprovalDrafts(store: ManualApprovalDraftStore, query: ManualApprovalDraftQuery): ManualApprovalDraft[] {
  return query.apply(store.list());
}
