import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyFunnelDraft } from "./legacy-funnel-draft.js";

/** Keeps legacy funnel drafts by code. */
export interface LegacyFunnelDraftStore {
  find(code: string): LegacyFunnelDraft | undefined;
  save(item: LegacyFunnelDraft): void;
  remove(code: string): boolean;
  list(): LegacyFunnelDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyFunnelDraftStore implements LegacyFunnelDraftStore {
  items: Map<string, LegacyFunnelDraft>;
  order: string[];

  constructor(items: Map<string, LegacyFunnelDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyFunnelDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyFunnelDraft): void {
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

  list(): LegacyFunnelDraft[] {
    const out: LegacyFunnelDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyFunnelDraftStore(): LegacyFunnelDraftStore {
  return new MemoryLegacyFunnelDraftStore(new Map<string, LegacyFunnelDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyFunnelDraftStore implements LegacyFunnelDraftStore {
  inner: LegacyFunnelDraftStore;
  cache: cache.TtlCache<LegacyFunnelDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyFunnelDraftStore,
    cacheValue: cache.TtlCache<LegacyFunnelDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyFunnelDraft | undefined {
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

  save(item: LegacyFunnelDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyFunnelDraft[] {
    return this.inner.list();
  }
}

export function newCachedLegacyFunnelDraftStore(inner: LegacyFunnelDraftStore, ttl: number, clockValue: clock.Clock): LegacyFunnelDraftStore {
  return new CachedLegacyFunnelDraftStore(inner, cache.newTtlCache<LegacyFunnelDraft>(512, ttl, clockValue), 0, 0);
}

/** Selects legacy funnel drafts. Empty fields match all. */
export class LegacyFunnelDraftQuery {
  channel: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minLimit: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyFunnelDraft): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyFunnelDraft[]): LegacyFunnelDraft[] {
    const matched = collections.filter(items, (candidate: LegacyFunnelDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyFunnelDrafts(store: LegacyFunnelDraftStore, query: LegacyFunnelDraftQuery): LegacyFunnelDraft[] {
  return query.apply(store.list());
}
