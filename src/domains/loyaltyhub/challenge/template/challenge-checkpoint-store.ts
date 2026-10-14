import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ChallengeCheckpoint } from "./challenge-checkpoint.js";

/** Keeps challenge checkpoints by code. */
export interface ChallengeCheckpointStore {
  find(code: string): ChallengeCheckpoint | undefined;
  save(item: ChallengeCheckpoint): void;
  remove(code: string): boolean;
  list(): ChallengeCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryChallengeCheckpointStore implements ChallengeCheckpointStore {
  items: Map<string, ChallengeCheckpoint>;
  order: string[];

  constructor(items: Map<string, ChallengeCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ChallengeCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ChallengeCheckpoint): void {
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

  list(): ChallengeCheckpoint[] {
    const out: ChallengeCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryChallengeCheckpointStore(): ChallengeCheckpointStore {
  return new MemoryChallengeCheckpointStore(new Map<string, ChallengeCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedChallengeCheckpointStore implements ChallengeCheckpointStore {
  inner: ChallengeCheckpointStore;
  cache: cache.TtlCache<ChallengeCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: ChallengeCheckpointStore,
    cacheValue: cache.TtlCache<ChallengeCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ChallengeCheckpoint | undefined {
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

  save(item: ChallengeCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ChallengeCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedChallengeCheckpointStore(inner: ChallengeCheckpointStore, ttl: number, clockValue: clock.Clock): ChallengeCheckpointStore {
  return new CachedChallengeCheckpointStore(inner, cache.newTtlCache<ChallengeCheckpoint>(512, ttl, clockValue), 0, 0);
}

/** Selects challenge checkpoints. Empty fields match all. */
export class ChallengeCheckpointQuery {
  title: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMinimum: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ChallengeCheckpoint): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ChallengeCheckpoint[]): ChallengeCheckpoint[] {
    const matched = collections.filter(items, (candidate: ChallengeCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findChallengeCheckpoints(store: ChallengeCheckpointStore, query: ChallengeCheckpointQuery): ChallengeCheckpoint[] {
  return query.apply(store.list());
}
