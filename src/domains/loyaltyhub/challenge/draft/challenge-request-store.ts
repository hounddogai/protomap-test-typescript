import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ChallengeRequest } from "./challenge-request.js";

/** Keeps challenge requests by code. */
export interface ChallengeRequestStore {
  find(code: string): ChallengeRequest | undefined;
  save(item: ChallengeRequest): void;
  remove(code: string): boolean;
  list(): ChallengeRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryChallengeRequestStore implements ChallengeRequestStore {
  items: Map<string, ChallengeRequest>;
  order: string[];

  constructor(items: Map<string, ChallengeRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ChallengeRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ChallengeRequest): void {
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

  list(): ChallengeRequest[] {
    const out: ChallengeRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryChallengeRequestStore(): ChallengeRequestStore {
  return new MemoryChallengeRequestStore(new Map<string, ChallengeRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedChallengeRequestStore implements ChallengeRequestStore {
  inner: ChallengeRequestStore;
  cache: cache.TtlCache<ChallengeRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: ChallengeRequestStore,
    cacheValue: cache.TtlCache<ChallengeRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ChallengeRequest | undefined {
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

  save(item: ChallengeRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ChallengeRequest[] {
    return this.inner.list();
  }
}

export function newCachedChallengeRequestStore(inner: ChallengeRequestStore, ttl: number, clockValue: clock.Clock): ChallengeRequestStore {
  return new CachedChallengeRequestStore(inner, cache.newTtlCache<ChallengeRequest>(128, ttl, clockValue), 0, 0);
}

/** Selects challenge requests. Empty fields match all. */
export class ChallengeRequestQuery {
  label: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minScore: number, statuses: string[], limit: number) {
    this.label = label;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ChallengeRequest): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ChallengeRequest[]): ChallengeRequest[] {
    const matched = collections.filter(items, (candidate: ChallengeRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findChallengeRequests(store: ChallengeRequestStore, query: ChallengeRequestQuery): ChallengeRequest[] {
  return query.apply(store.list());
}
