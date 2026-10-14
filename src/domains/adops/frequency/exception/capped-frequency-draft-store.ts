import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedFrequencyDraft } from "./capped-frequency-draft.js";

/** Keeps capped frequency drafts by code. */
export interface CappedFrequencyDraftStore {
  find(code: string): CappedFrequencyDraft | undefined;
  save(item: CappedFrequencyDraft): void;
  remove(code: string): boolean;
  list(): CappedFrequencyDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedFrequencyDraftStore implements CappedFrequencyDraftStore {
  items: Map<string, CappedFrequencyDraft>;
  order: string[];

  constructor(items: Map<string, CappedFrequencyDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedFrequencyDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedFrequencyDraft): void {
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

  list(): CappedFrequencyDraft[] {
    const out: CappedFrequencyDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedFrequencyDraftStore(): CappedFrequencyDraftStore {
  return new MemoryCappedFrequencyDraftStore(new Map<string, CappedFrequencyDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedFrequencyDraftStore implements CappedFrequencyDraftStore {
  inner: CappedFrequencyDraftStore;
  cache: cache.TtlCache<CappedFrequencyDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedFrequencyDraftStore,
    cacheValue: cache.TtlCache<CappedFrequencyDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedFrequencyDraft | undefined {
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

  save(item: CappedFrequencyDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedFrequencyDraft[] {
    return this.inner.list();
  }
}

export function newCachedCappedFrequencyDraftStore(inner: CappedFrequencyDraftStore, ttl: number, clockValue: clock.Clock): CappedFrequencyDraftStore {
  return new CachedCappedFrequencyDraftStore(inner, cache.newTtlCache<CappedFrequencyDraft>(64, ttl, clockValue), 0, 0);
}

/** Selects capped frequency drafts. Empty fields match all. */
export class CappedFrequencyDraftQuery {
  channel: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minVersion: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedFrequencyDraft): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedFrequencyDraft[]): CappedFrequencyDraft[] {
    const matched = collections.filter(items, (candidate: CappedFrequencyDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedFrequencyDrafts(store: CappedFrequencyDraftStore, query: CappedFrequencyDraftQuery): CappedFrequencyDraft[] {
  return query.apply(store.list());
}
