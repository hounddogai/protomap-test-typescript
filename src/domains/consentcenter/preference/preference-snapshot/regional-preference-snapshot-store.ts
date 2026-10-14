import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalPreferenceSnapshot } from "./regional-preference-snapshot.js";

/** Keeps regional preference snapshots by code. */
export interface RegionalPreferenceSnapshotStore {
  find(code: string): RegionalPreferenceSnapshot | undefined;
  save(item: RegionalPreferenceSnapshot): void;
  remove(code: string): boolean;
  list(): RegionalPreferenceSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalPreferenceSnapshotStore implements RegionalPreferenceSnapshotStore {
  items: Map<string, RegionalPreferenceSnapshot>;
  order: string[];

  constructor(items: Map<string, RegionalPreferenceSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalPreferenceSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalPreferenceSnapshot): void {
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

  list(): RegionalPreferenceSnapshot[] {
    const out: RegionalPreferenceSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalPreferenceSnapshotStore(): RegionalPreferenceSnapshotStore {
  return new MemoryRegionalPreferenceSnapshotStore(new Map<string, RegionalPreferenceSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalPreferenceSnapshotStore implements RegionalPreferenceSnapshotStore {
  inner: RegionalPreferenceSnapshotStore;
  cache: cache.TtlCache<RegionalPreferenceSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalPreferenceSnapshotStore,
    cacheValue: cache.TtlCache<RegionalPreferenceSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalPreferenceSnapshot | undefined {
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

  save(item: RegionalPreferenceSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalPreferenceSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedRegionalPreferenceSnapshotStore(inner: RegionalPreferenceSnapshotStore, ttl: number, clockValue: clock.Clock): RegionalPreferenceSnapshotStore {
  return new CachedRegionalPreferenceSnapshotStore(
    inner,
    cache.newTtlCache<RegionalPreferenceSnapshot>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional preference snapshots. Empty fields match all. */
export class RegionalPreferenceSnapshotQuery {
  label: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minAttempts: number, statuses: string[], limit: number) {
    this.label = label;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalPreferenceSnapshot): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalPreferenceSnapshot[]): RegionalPreferenceSnapshot[] {
    const matched = collections.filter(items, (candidate: RegionalPreferenceSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalPreferenceSnapshots(store: RegionalPreferenceSnapshotStore, query: RegionalPreferenceSnapshotQuery): RegionalPreferenceSnapshot[] {
  return query.apply(store.list());
}
