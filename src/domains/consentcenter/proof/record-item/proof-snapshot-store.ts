import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ProofSnapshot } from "./proof-snapshot.js";

/** Keeps proof snapshots by code. */
export interface ProofSnapshotStore {
  find(code: string): ProofSnapshot | undefined;
  save(item: ProofSnapshot): void;
  remove(code: string): boolean;
  list(): ProofSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryProofSnapshotStore implements ProofSnapshotStore {
  items: Map<string, ProofSnapshot>;
  order: string[];

  constructor(items: Map<string, ProofSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ProofSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ProofSnapshot): void {
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

  list(): ProofSnapshot[] {
    const out: ProofSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryProofSnapshotStore(): ProofSnapshotStore {
  return new MemoryProofSnapshotStore(new Map<string, ProofSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedProofSnapshotStore implements ProofSnapshotStore {
  inner: ProofSnapshotStore;
  cache: cache.TtlCache<ProofSnapshot>;
  hits: number;
  misses: number;

  constructor(inner: ProofSnapshotStore, cacheValue: cache.TtlCache<ProofSnapshot>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ProofSnapshot | undefined {
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

  save(item: ProofSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ProofSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedProofSnapshotStore(inner: ProofSnapshotStore, ttl: number, clockValue: clock.Clock): ProofSnapshotStore {
  return new CachedProofSnapshotStore(inner, cache.newTtlCache<ProofSnapshot>(512, ttl, clockValue), 0, 0);
}

/** Selects proof snapshots. Empty fields match all. */
export class ProofSnapshotQuery {
  title: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCeiling: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ProofSnapshot): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ProofSnapshot[]): ProofSnapshot[] {
    const matched = collections.filter(items, (candidate: ProofSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findProofSnapshots(store: ProofSnapshotStore, query: ProofSnapshotQuery): ProofSnapshot[] {
  return query.apply(store.list());
}
