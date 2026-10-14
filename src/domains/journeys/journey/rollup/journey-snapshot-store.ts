import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { JourneySnapshot } from "./journey-snapshot.js";

/** Keeps journey snapshots by code. */
export interface JourneySnapshotStore {
  find(code: string): JourneySnapshot | undefined;
  save(item: JourneySnapshot): void;
  remove(code: string): boolean;
  list(): JourneySnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryJourneySnapshotStore implements JourneySnapshotStore {
  items: Map<string, JourneySnapshot>;
  order: string[];

  constructor(items: Map<string, JourneySnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): JourneySnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: JourneySnapshot): void {
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

  list(): JourneySnapshot[] {
    const out: JourneySnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryJourneySnapshotStore(): JourneySnapshotStore {
  return new MemoryJourneySnapshotStore(new Map<string, JourneySnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedJourneySnapshotStore implements JourneySnapshotStore {
  inner: JourneySnapshotStore;
  cache: cache.TtlCache<JourneySnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: JourneySnapshotStore,
    cacheValue: cache.TtlCache<JourneySnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): JourneySnapshot | undefined {
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

  save(item: JourneySnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): JourneySnapshot[] {
    return this.inner.list();
  }
}

export function newCachedJourneySnapshotStore(inner: JourneySnapshotStore, ttl: number, clockValue: clock.Clock): JourneySnapshotStore {
  return new CachedJourneySnapshotStore(inner, cache.newTtlCache<JourneySnapshot>(1024, ttl, clockValue), 0, 0);
}

/** Selects journey snapshots. Empty fields match all. */
export class JourneySnapshotQuery {
  label: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMaximum: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: JourneySnapshot): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: JourneySnapshot[]): JourneySnapshot[] {
    const matched = collections.filter(items, (candidate: JourneySnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findJourneySnapshots(store: JourneySnapshotStore, query: JourneySnapshotQuery): JourneySnapshot[] {
  return query.apply(store.list());
}
