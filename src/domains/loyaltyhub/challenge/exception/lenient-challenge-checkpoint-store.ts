import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientChallengeCheckpoint } from "./lenient-challenge-checkpoint.js";

/** Keeps lenient challenge checkpoints by code. */
export interface LenientChallengeCheckpointStore {
  find(code: string): LenientChallengeCheckpoint | undefined;
  save(item: LenientChallengeCheckpoint): void;
  remove(code: string): boolean;
  list(): LenientChallengeCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientChallengeCheckpointStore implements LenientChallengeCheckpointStore {
  items: Map<string, LenientChallengeCheckpoint>;
  order: string[];

  constructor(items: Map<string, LenientChallengeCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientChallengeCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientChallengeCheckpoint): void {
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

  list(): LenientChallengeCheckpoint[] {
    const out: LenientChallengeCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientChallengeCheckpointStore(): LenientChallengeCheckpointStore {
  return new MemoryLenientChallengeCheckpointStore(new Map<string, LenientChallengeCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientChallengeCheckpointStore implements LenientChallengeCheckpointStore {
  inner: LenientChallengeCheckpointStore;
  cache: cache.TtlCache<LenientChallengeCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientChallengeCheckpointStore,
    cacheValue: cache.TtlCache<LenientChallengeCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientChallengeCheckpoint | undefined {
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

  save(item: LenientChallengeCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientChallengeCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedLenientChallengeCheckpointStore(inner: LenientChallengeCheckpointStore, ttl: number, clockValue: clock.Clock): LenientChallengeCheckpointStore {
  return new CachedLenientChallengeCheckpointStore(
    inner,
    cache.newTtlCache<LenientChallengeCheckpoint>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient challenge checkpoints. Empty fields match all. */
export class LenientChallengeCheckpointQuery {
  locale: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minMaximum: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientChallengeCheckpoint): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientChallengeCheckpoint[]): LenientChallengeCheckpoint[] {
    const matched = collections.filter(items, (candidate: LenientChallengeCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientChallengeCheckpoints(store: LenientChallengeCheckpointStore, query: LenientChallengeCheckpointQuery): LenientChallengeCheckpoint[] {
  return query.apply(store.list());
}
