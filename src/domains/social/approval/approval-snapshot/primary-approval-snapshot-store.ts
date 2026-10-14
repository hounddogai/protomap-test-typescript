import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryApprovalSnapshot } from "./primary-approval-snapshot.js";

/** Keeps primary approval snapshots by code. */
export interface PrimaryApprovalSnapshotStore {
  find(code: string): PrimaryApprovalSnapshot | undefined;
  save(item: PrimaryApprovalSnapshot): void;
  remove(code: string): boolean;
  list(): PrimaryApprovalSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryApprovalSnapshotStore implements PrimaryApprovalSnapshotStore {
  items: Map<string, PrimaryApprovalSnapshot>;
  order: string[];

  constructor(items: Map<string, PrimaryApprovalSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryApprovalSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryApprovalSnapshot): void {
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

  list(): PrimaryApprovalSnapshot[] {
    const out: PrimaryApprovalSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryApprovalSnapshotStore(): PrimaryApprovalSnapshotStore {
  return new MemoryPrimaryApprovalSnapshotStore(new Map<string, PrimaryApprovalSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryApprovalSnapshotStore implements PrimaryApprovalSnapshotStore {
  inner: PrimaryApprovalSnapshotStore;
  cache: cache.TtlCache<PrimaryApprovalSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryApprovalSnapshotStore,
    cacheValue: cache.TtlCache<PrimaryApprovalSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryApprovalSnapshot | undefined {
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

  save(item: PrimaryApprovalSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryApprovalSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryApprovalSnapshotStore(inner: PrimaryApprovalSnapshotStore, ttl: number, clockValue: clock.Clock): PrimaryApprovalSnapshotStore {
  return new CachedPrimaryApprovalSnapshotStore(
    inner,
    cache.newTtlCache<PrimaryApprovalSnapshot>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary approval snapshots. Empty fields match all. */
export class PrimaryApprovalSnapshotQuery {
  title: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minAttempts: number, statuses: string[], limit: number) {
    this.title = title;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryApprovalSnapshot): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryApprovalSnapshot[]): PrimaryApprovalSnapshot[] {
    const matched = collections.filter(items, (candidate: PrimaryApprovalSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryApprovalSnapshots(store: PrimaryApprovalSnapshotStore, query: PrimaryApprovalSnapshotQuery): PrimaryApprovalSnapshot[] {
  return query.apply(store.list());
}
