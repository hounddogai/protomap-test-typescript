import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InsightProfile } from "./insight-profile.js";

/** Keeps insight profiles by code. */
export interface InsightProfileStore {
  find(code: string): InsightProfile | undefined;
  save(item: InsightProfile): void;
  remove(code: string): boolean;
  list(): InsightProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInsightProfileStore implements InsightProfileStore {
  items: Map<string, InsightProfile>;
  order: string[];

  constructor(items: Map<string, InsightProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InsightProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InsightProfile): void {
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

  list(): InsightProfile[] {
    const out: InsightProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInsightProfileStore(): InsightProfileStore {
  return new MemoryInsightProfileStore(new Map<string, InsightProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInsightProfileStore implements InsightProfileStore {
  inner: InsightProfileStore;
  cache: cache.TtlCache<InsightProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: InsightProfileStore,
    cacheValue: cache.TtlCache<InsightProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InsightProfile | undefined {
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

  save(item: InsightProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InsightProfile[] {
    return this.inner.list();
  }
}

export function newCachedInsightProfileStore(inner: InsightProfileStore, ttl: number, clockValue: clock.Clock): InsightProfileStore {
  return new CachedInsightProfileStore(inner, cache.newTtlCache<InsightProfile>(1024, ttl, clockValue), 0, 0);
}

/** Selects insight profiles. Empty fields match all. */
export class InsightProfileQuery {
  segment: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minScore: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InsightProfile): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InsightProfile[]): InsightProfile[] {
    const matched = collections.filter(items, (candidate: InsightProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInsightProfiles(store: InsightProfileStore, query: InsightProfileQuery): InsightProfile[] {
  return query.apply(store.list());
}
