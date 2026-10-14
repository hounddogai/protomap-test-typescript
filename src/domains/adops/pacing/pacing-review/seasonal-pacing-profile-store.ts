import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalPacingProfile } from "./seasonal-pacing-profile.js";

/** Keeps seasonal pacing profiles by code. */
export interface SeasonalPacingProfileStore {
  find(code: string): SeasonalPacingProfile | undefined;
  save(item: SeasonalPacingProfile): void;
  remove(code: string): boolean;
  list(): SeasonalPacingProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalPacingProfileStore implements SeasonalPacingProfileStore {
  items: Map<string, SeasonalPacingProfile>;
  order: string[];

  constructor(items: Map<string, SeasonalPacingProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalPacingProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalPacingProfile): void {
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

  list(): SeasonalPacingProfile[] {
    const out: SeasonalPacingProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalPacingProfileStore(): SeasonalPacingProfileStore {
  return new MemorySeasonalPacingProfileStore(new Map<string, SeasonalPacingProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalPacingProfileStore implements SeasonalPacingProfileStore {
  inner: SeasonalPacingProfileStore;
  cache: cache.TtlCache<SeasonalPacingProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalPacingProfileStore,
    cacheValue: cache.TtlCache<SeasonalPacingProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalPacingProfile | undefined {
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

  save(item: SeasonalPacingProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalPacingProfile[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalPacingProfileStore(inner: SeasonalPacingProfileStore, ttl: number, clockValue: clock.Clock): SeasonalPacingProfileStore {
  return new CachedSeasonalPacingProfileStore(
    inner,
    cache.newTtlCache<SeasonalPacingProfile>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal pacing profiles. Empty fields match all. */
export class SeasonalPacingProfileQuery {
  title: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minScore: number, statuses: string[], limit: number) {
    this.title = title;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalPacingProfile): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalPacingProfile[]): SeasonalPacingProfile[] {
    const matched = collections.filter(items, (candidate: SeasonalPacingProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalPacingProfiles(store: SeasonalPacingProfileStore, query: SeasonalPacingProfileQuery): SeasonalPacingProfile[] {
  return query.apply(store.list());
}
