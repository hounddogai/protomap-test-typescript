import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ChallengeProfile } from "./challenge-profile.js";

/** Keeps challenge profiles by code. */
export interface ChallengeProfileStore {
  find(code: string): ChallengeProfile | undefined;
  save(item: ChallengeProfile): void;
  remove(code: string): boolean;
  list(): ChallengeProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryChallengeProfileStore implements ChallengeProfileStore {
  items: Map<string, ChallengeProfile>;
  order: string[];

  constructor(items: Map<string, ChallengeProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ChallengeProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ChallengeProfile): void {
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

  list(): ChallengeProfile[] {
    const out: ChallengeProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryChallengeProfileStore(): ChallengeProfileStore {
  return new MemoryChallengeProfileStore(new Map<string, ChallengeProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedChallengeProfileStore implements ChallengeProfileStore {
  inner: ChallengeProfileStore;
  cache: cache.TtlCache<ChallengeProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: ChallengeProfileStore,
    cacheValue: cache.TtlCache<ChallengeProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ChallengeProfile | undefined {
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

  save(item: ChallengeProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ChallengeProfile[] {
    return this.inner.list();
  }
}

export function newCachedChallengeProfileStore(inner: ChallengeProfileStore, ttl: number, clockValue: clock.Clock): ChallengeProfileStore {
  return new CachedChallengeProfileStore(inner, cache.newTtlCache<ChallengeProfile>(1024, ttl, clockValue), 0, 0);
}

/** Selects challenge profiles. Empty fields match all. */
export class ChallengeProfileQuery {
  channel: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBatchSize: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ChallengeProfile): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ChallengeProfile[]): ChallengeProfile[] {
    const matched = collections.filter(items, (candidate: ChallengeProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findChallengeProfiles(store: ChallengeProfileStore, query: ChallengeProfileQuery): ChallengeProfile[] {
  return query.apply(store.list());
}
