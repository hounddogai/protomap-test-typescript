import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ApprovalSnapshot } from "./approval-snapshot.js";

/** Keeps approval snapshots by code. */
export interface ApprovalSnapshotStore {
  find(code: string): ApprovalSnapshot | undefined;
  save(item: ApprovalSnapshot): void;
  remove(code: string): boolean;
  list(): ApprovalSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryApprovalSnapshotStore implements ApprovalSnapshotStore {
  items: Map<string, ApprovalSnapshot>;
  order: string[];

  constructor(items: Map<string, ApprovalSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ApprovalSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ApprovalSnapshot): void {
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

  list(): ApprovalSnapshot[] {
    const out: ApprovalSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryApprovalSnapshotStore(): ApprovalSnapshotStore {
  return new MemoryApprovalSnapshotStore(new Map<string, ApprovalSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedApprovalSnapshotStore implements ApprovalSnapshotStore {
  inner: ApprovalSnapshotStore;
  cache: cache.TtlCache<ApprovalSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: ApprovalSnapshotStore,
    cacheValue: cache.TtlCache<ApprovalSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ApprovalSnapshot | undefined {
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

  save(item: ApprovalSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ApprovalSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedApprovalSnapshotStore(inner: ApprovalSnapshotStore, ttl: number, clockValue: clock.Clock): ApprovalSnapshotStore {
  return new CachedApprovalSnapshotStore(inner, cache.newTtlCache<ApprovalSnapshot>(512, ttl, clockValue), 0, 0);
}

/** Selects approval snapshots. Empty fields match all. */
export class ApprovalSnapshotQuery {
  name: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minSendAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ApprovalSnapshot): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ApprovalSnapshot[]): ApprovalSnapshot[] {
    const matched = collections.filter(items, (candidate: ApprovalSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findApprovalSnapshots(store: ApprovalSnapshotStore, query: ApprovalSnapshotQuery): ApprovalSnapshot[] {
  return query.apply(store.list());
}
