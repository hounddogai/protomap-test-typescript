import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyTicketViewDraft } from "./legacy-ticket-view-draft.js";

/** Keeps legacy ticket view drafts by code. */
export interface LegacyTicketViewDraftStore {
  find(code: string): LegacyTicketViewDraft | undefined;
  save(item: LegacyTicketViewDraft): void;
  remove(code: string): boolean;
  list(): LegacyTicketViewDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyTicketViewDraftStore implements LegacyTicketViewDraftStore {
  items: Map<string, LegacyTicketViewDraft>;
  order: string[];

  constructor(items: Map<string, LegacyTicketViewDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyTicketViewDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyTicketViewDraft): void {
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

  list(): LegacyTicketViewDraft[] {
    const out: LegacyTicketViewDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyTicketViewDraftStore(): LegacyTicketViewDraftStore {
  return new MemoryLegacyTicketViewDraftStore(new Map<string, LegacyTicketViewDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyTicketViewDraftStore implements LegacyTicketViewDraftStore {
  inner: LegacyTicketViewDraftStore;
  cache: cache.TtlCache<LegacyTicketViewDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyTicketViewDraftStore,
    cacheValue: cache.TtlCache<LegacyTicketViewDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyTicketViewDraft | undefined {
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

  save(item: LegacyTicketViewDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyTicketViewDraft[] {
    return this.inner.list();
  }
}

export function newCachedLegacyTicketViewDraftStore(inner: LegacyTicketViewDraftStore, ttl: number, clockValue: clock.Clock): LegacyTicketViewDraftStore {
  return new CachedLegacyTicketViewDraftStore(
    inner,
    cache.newTtlCache<LegacyTicketViewDraft>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy ticket view drafts. Empty fields match all. */
export class LegacyTicketViewDraftQuery {
  source: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.source = source;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyTicketViewDraft): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyTicketViewDraft[]): LegacyTicketViewDraft[] {
    const matched = collections.filter(items, (candidate: LegacyTicketViewDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyTicketViewDrafts(store: LegacyTicketViewDraftStore, query: LegacyTicketViewDraftQuery): LegacyTicketViewDraft[] {
  return query.apply(store.list());
}
