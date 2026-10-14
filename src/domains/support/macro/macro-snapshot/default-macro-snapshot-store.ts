import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultMacroSnapshot } from "./default-macro-snapshot.js";

/** Keeps default macro snapshots by code. */
export interface DefaultMacroSnapshotStore {
  find(code: string): DefaultMacroSnapshot | undefined;
  save(item: DefaultMacroSnapshot): void;
  remove(code: string): boolean;
  list(): DefaultMacroSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultMacroSnapshotStore implements DefaultMacroSnapshotStore {
  items: Map<string, DefaultMacroSnapshot>;
  order: string[];

  constructor(items: Map<string, DefaultMacroSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultMacroSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultMacroSnapshot): void {
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

  list(): DefaultMacroSnapshot[] {
    const out: DefaultMacroSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultMacroSnapshotStore(): DefaultMacroSnapshotStore {
  return new MemoryDefaultMacroSnapshotStore(new Map<string, DefaultMacroSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultMacroSnapshotStore implements DefaultMacroSnapshotStore {
  inner: DefaultMacroSnapshotStore;
  cache: cache.TtlCache<DefaultMacroSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultMacroSnapshotStore,
    cacheValue: cache.TtlCache<DefaultMacroSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultMacroSnapshot | undefined {
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

  save(item: DefaultMacroSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultMacroSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedDefaultMacroSnapshotStore(inner: DefaultMacroSnapshotStore, ttl: number, clockValue: clock.Clock): DefaultMacroSnapshotStore {
  return new CachedDefaultMacroSnapshotStore(
    inner,
    cache.newTtlCache<DefaultMacroSnapshot>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default macro snapshots. Empty fields match all. */
export class DefaultMacroSnapshotQuery {
  name: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCost: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultMacroSnapshot): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultMacroSnapshot[]): DefaultMacroSnapshot[] {
    const matched = collections.filter(items, (candidate: DefaultMacroSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultMacroSnapshots(store: DefaultMacroSnapshotStore, query: DefaultMacroSnapshotQuery): DefaultMacroSnapshot[] {
  return query.apply(store.list());
}
