import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalReputationDigest } from "./seasonal-reputation-digest.js";

/** Keeps seasonal reputation digests by code. */
export interface SeasonalReputationDigestStore {
  find(code: string): SeasonalReputationDigest | undefined;
  save(item: SeasonalReputationDigest): void;
  remove(code: string): boolean;
  list(): SeasonalReputationDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalReputationDigestStore implements SeasonalReputationDigestStore {
  items: Map<string, SeasonalReputationDigest>;
  order: string[];

  constructor(items: Map<string, SeasonalReputationDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalReputationDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalReputationDigest): void {
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

  list(): SeasonalReputationDigest[] {
    const out: SeasonalReputationDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalReputationDigestStore(): SeasonalReputationDigestStore {
  return new MemorySeasonalReputationDigestStore(new Map<string, SeasonalReputationDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalReputationDigestStore implements SeasonalReputationDigestStore {
  inner: SeasonalReputationDigestStore;
  cache: cache.TtlCache<SeasonalReputationDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalReputationDigestStore,
    cacheValue: cache.TtlCache<SeasonalReputationDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalReputationDigest | undefined {
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

  save(item: SeasonalReputationDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalReputationDigest[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalReputationDigestStore(inner: SeasonalReputationDigestStore, ttl: number, clockValue: clock.Clock): SeasonalReputationDigestStore {
  return new CachedSeasonalReputationDigestStore(
    inner,
    cache.newTtlCache<SeasonalReputationDigest>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal reputation digests. Empty fields match all. */
export class SeasonalReputationDigestQuery {
  utmSource: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minRevision: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalReputationDigest): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalReputationDigest[]): SeasonalReputationDigest[] {
    const matched = collections.filter(items, (candidate: SeasonalReputationDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalReputationDigests(store: SeasonalReputationDigestStore, query: SeasonalReputationDigestQuery): SeasonalReputationDigest[] {
  return query.apply(store.list());
}
