import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedMentionPreference } from "./capped-mention-preference.js";

/** Keeps capped mention preferences by code. */
export interface CappedMentionPreferenceStore {
  find(code: string): CappedMentionPreference | undefined;
  save(item: CappedMentionPreference): void;
  remove(code: string): boolean;
  list(): CappedMentionPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedMentionPreferenceStore implements CappedMentionPreferenceStore {
  items: Map<string, CappedMentionPreference>;
  order: string[];

  constructor(items: Map<string, CappedMentionPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedMentionPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedMentionPreference): void {
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

  list(): CappedMentionPreference[] {
    const out: CappedMentionPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedMentionPreferenceStore(): CappedMentionPreferenceStore {
  return new MemoryCappedMentionPreferenceStore(new Map<string, CappedMentionPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedMentionPreferenceStore implements CappedMentionPreferenceStore {
  inner: CappedMentionPreferenceStore;
  cache: cache.TtlCache<CappedMentionPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedMentionPreferenceStore,
    cacheValue: cache.TtlCache<CappedMentionPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedMentionPreference | undefined {
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

  save(item: CappedMentionPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedMentionPreference[] {
    return this.inner.list();
  }
}

export function newCachedCappedMentionPreferenceStore(inner: CappedMentionPreferenceStore, ttl: number, clockValue: clock.Clock): CappedMentionPreferenceStore {
  return new CachedCappedMentionPreferenceStore(
    inner,
    cache.newTtlCache<CappedMentionPreference>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped mention preferences. Empty fields match all. */
export class CappedMentionPreferenceQuery {
  source: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minRevision: number, statuses: string[], limit: number) {
    this.source = source;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedMentionPreference): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedMentionPreference[]): CappedMentionPreference[] {
    const matched = collections.filter(items, (candidate: CappedMentionPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedMentionPreferences(store: CappedMentionPreferenceStore, query: CappedMentionPreferenceQuery): CappedMentionPreference[] {
  return query.apply(store.list());
}
