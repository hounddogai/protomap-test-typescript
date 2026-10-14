import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ChallengeException } from "./challenge-exception.js";

/** Keeps challenge exceptions by code. */
export interface ChallengeExceptionStore {
  find(code: string): ChallengeException | undefined;
  save(item: ChallengeException): void;
  remove(code: string): boolean;
  list(): ChallengeException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryChallengeExceptionStore implements ChallengeExceptionStore {
  items: Map<string, ChallengeException>;
  order: string[];

  constructor(items: Map<string, ChallengeException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ChallengeException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ChallengeException): void {
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

  list(): ChallengeException[] {
    const out: ChallengeException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryChallengeExceptionStore(): ChallengeExceptionStore {
  return new MemoryChallengeExceptionStore(new Map<string, ChallengeException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedChallengeExceptionStore implements ChallengeExceptionStore {
  inner: ChallengeExceptionStore;
  cache: cache.TtlCache<ChallengeException>;
  hits: number;
  misses: number;

  constructor(
    inner: ChallengeExceptionStore,
    cacheValue: cache.TtlCache<ChallengeException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ChallengeException | undefined {
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

  save(item: ChallengeException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ChallengeException[] {
    return this.inner.list();
  }
}

export function newCachedChallengeExceptionStore(inner: ChallengeExceptionStore, ttl: number, clockValue: clock.Clock): ChallengeExceptionStore {
  return new CachedChallengeExceptionStore(inner, cache.newTtlCache<ChallengeException>(1024, ttl, clockValue), 0, 0);
}

/** Selects challenge exceptions. Empty fields match all. */
export class ChallengeExceptionQuery {
  label: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ChallengeException): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ChallengeException[]): ChallengeException[] {
    const matched = collections.filter(items, (candidate: ChallengeException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findChallengeExceptions(store: ChallengeExceptionStore, query: ChallengeExceptionQuery): ChallengeException[] {
  return query.apply(store.list());
}
