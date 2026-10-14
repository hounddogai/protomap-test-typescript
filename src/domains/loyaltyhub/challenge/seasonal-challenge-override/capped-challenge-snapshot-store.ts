import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedChallengeSnapshot } from "./capped-challenge-snapshot.js";

/** Keeps capped challenge snapshots by code. */
export interface CappedChallengeSnapshotStore {
  find(code: string): CappedChallengeSnapshot | undefined;
  save(item: CappedChallengeSnapshot): void;
  remove(code: string): boolean;
  list(): CappedChallengeSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedChallengeSnapshotStore implements CappedChallengeSnapshotStore {
  items: Map<string, CappedChallengeSnapshot>;
  order: string[];

  constructor(items: Map<string, CappedChallengeSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedChallengeSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedChallengeSnapshot): void {
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

  list(): CappedChallengeSnapshot[] {
    const out: CappedChallengeSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedChallengeSnapshotStore(): CappedChallengeSnapshotStore {
  return new MemoryCappedChallengeSnapshotStore(new Map<string, CappedChallengeSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedChallengeSnapshotStore implements CappedChallengeSnapshotStore {
  inner: CappedChallengeSnapshotStore;
  cache: cache.TtlCache<CappedChallengeSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedChallengeSnapshotStore,
    cacheValue: cache.TtlCache<CappedChallengeSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedChallengeSnapshot | undefined {
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

  save(item: CappedChallengeSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedChallengeSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedCappedChallengeSnapshotStore(inner: CappedChallengeSnapshotStore, ttl: number, clockValue: clock.Clock): CappedChallengeSnapshotStore {
  return new CachedCappedChallengeSnapshotStore(
    inner,
    cache.newTtlCache<CappedChallengeSnapshot>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped challenge snapshots. Empty fields match all. */
export class CappedChallengeSnapshotQuery {
  locale: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minThreshold: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedChallengeSnapshot): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedChallengeSnapshot[]): CappedChallengeSnapshot[] {
    const matched = collections.filter(items, (candidate: CappedChallengeSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedChallengeSnapshots(store: CappedChallengeSnapshotStore, query: CappedChallengeSnapshotQuery): CappedChallengeSnapshot[] {
  return query.apply(store.list());
}
