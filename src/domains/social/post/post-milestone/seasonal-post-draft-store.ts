import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalPostDraft } from "./seasonal-post-draft.js";

/** Keeps seasonal post drafts by code. */
export interface SeasonalPostDraftStore {
  find(code: string): SeasonalPostDraft | undefined;
  save(item: SeasonalPostDraft): void;
  remove(code: string): boolean;
  list(): SeasonalPostDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalPostDraftStore implements SeasonalPostDraftStore {
  items: Map<string, SeasonalPostDraft>;
  order: string[];

  constructor(items: Map<string, SeasonalPostDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalPostDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalPostDraft): void {
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

  list(): SeasonalPostDraft[] {
    const out: SeasonalPostDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalPostDraftStore(): SeasonalPostDraftStore {
  return new MemorySeasonalPostDraftStore(new Map<string, SeasonalPostDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalPostDraftStore implements SeasonalPostDraftStore {
  inner: SeasonalPostDraftStore;
  cache: cache.TtlCache<SeasonalPostDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalPostDraftStore,
    cacheValue: cache.TtlCache<SeasonalPostDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalPostDraft | undefined {
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

  save(item: SeasonalPostDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalPostDraft[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalPostDraftStore(inner: SeasonalPostDraftStore, ttl: number, clockValue: clock.Clock): SeasonalPostDraftStore {
  return new CachedSeasonalPostDraftStore(inner, cache.newTtlCache<SeasonalPostDraft>(256, ttl, clockValue), 0, 0);
}

/** Selects seasonal post drafts. Empty fields match all. */
export class SeasonalPostDraftQuery {
  channel: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minImpressions: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalPostDraft): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalPostDraft[]): SeasonalPostDraft[] {
    const matched = collections.filter(items, (candidate: SeasonalPostDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalPostDrafts(store: SeasonalPostDraftStore, query: SeasonalPostDraftQuery): SeasonalPostDraft[] {
  return query.apply(store.list());
}
