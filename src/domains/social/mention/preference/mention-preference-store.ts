import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MentionPreference } from "./mention-preference.js";

/** Keeps mention preferences by code. */
export interface MentionPreferenceStore {
  find(code: string): MentionPreference | undefined;
  save(item: MentionPreference): void;
  remove(code: string): boolean;
  list(): MentionPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMentionPreferenceStore implements MentionPreferenceStore {
  items: Map<string, MentionPreference>;
  order: string[];

  constructor(items: Map<string, MentionPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MentionPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MentionPreference): void {
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

  list(): MentionPreference[] {
    const out: MentionPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMentionPreferenceStore(): MentionPreferenceStore {
  return new MemoryMentionPreferenceStore(new Map<string, MentionPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMentionPreferenceStore implements MentionPreferenceStore {
  inner: MentionPreferenceStore;
  cache: cache.TtlCache<MentionPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: MentionPreferenceStore,
    cacheValue: cache.TtlCache<MentionPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MentionPreference | undefined {
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

  save(item: MentionPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MentionPreference[] {
    return this.inner.list();
  }
}

export function newCachedMentionPreferenceStore(inner: MentionPreferenceStore, ttl: number, clockValue: clock.Clock): MentionPreferenceStore {
  return new CachedMentionPreferenceStore(inner, cache.newTtlCache<MentionPreference>(1024, ttl, clockValue), 0, 0);
}

/** Selects mention preferences. Empty fields match all. */
export class MentionPreferenceQuery {
  unit: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minScore: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MentionPreference): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MentionPreference[]): MentionPreference[] {
    const matched = collections.filter(items, (candidate: MentionPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMentionPreferences(store: MentionPreferenceStore, query: MentionPreferenceQuery): MentionPreference[] {
  return query.apply(store.list());
}
