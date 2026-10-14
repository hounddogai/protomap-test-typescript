import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyChallengePreference } from "./legacy-challenge-preference.js";

/** Keeps legacy challenge preferences by code. */
export interface LegacyChallengePreferenceStore {
  find(code: string): LegacyChallengePreference | undefined;
  save(item: LegacyChallengePreference): void;
  remove(code: string): boolean;
  list(): LegacyChallengePreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyChallengePreferenceStore implements LegacyChallengePreferenceStore {
  items: Map<string, LegacyChallengePreference>;
  order: string[];

  constructor(items: Map<string, LegacyChallengePreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyChallengePreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyChallengePreference): void {
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

  list(): LegacyChallengePreference[] {
    const out: LegacyChallengePreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyChallengePreferenceStore(): LegacyChallengePreferenceStore {
  return new MemoryLegacyChallengePreferenceStore(new Map<string, LegacyChallengePreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyChallengePreferenceStore implements LegacyChallengePreferenceStore {
  inner: LegacyChallengePreferenceStore;
  cache: cache.TtlCache<LegacyChallengePreference>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyChallengePreferenceStore,
    cacheValue: cache.TtlCache<LegacyChallengePreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyChallengePreference | undefined {
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

  save(item: LegacyChallengePreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyChallengePreference[] {
    return this.inner.list();
  }
}

export function newCachedLegacyChallengePreferenceStore(inner: LegacyChallengePreferenceStore, ttl: number, clockValue: clock.Clock): LegacyChallengePreferenceStore {
  return new CachedLegacyChallengePreferenceStore(
    inner,
    cache.newTtlCache<LegacyChallengePreference>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy challenge preferences. Empty fields match all. */
export class LegacyChallengePreferenceQuery {
  segment: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minClicks: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyChallengePreference): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyChallengePreference[]): LegacyChallengePreference[] {
    const matched = collections.filter(items, (candidate: LegacyChallengePreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyChallengePreferences(store: LegacyChallengePreferenceStore, query: LegacyChallengePreferenceQuery): LegacyChallengePreference[] {
  return query.apply(store.list());
}
