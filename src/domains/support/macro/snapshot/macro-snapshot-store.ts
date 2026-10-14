import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MacroSnapshot } from "./macro-snapshot.js";

/** Keeps macro snapshots by code. */
export interface MacroSnapshotStore {
  find(code: string): MacroSnapshot | undefined;
  save(item: MacroSnapshot): void;
  remove(code: string): boolean;
  list(): MacroSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMacroSnapshotStore implements MacroSnapshotStore {
  items: Map<string, MacroSnapshot>;
  order: string[];

  constructor(items: Map<string, MacroSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MacroSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MacroSnapshot): void {
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

  list(): MacroSnapshot[] {
    const out: MacroSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMacroSnapshotStore(): MacroSnapshotStore {
  return new MemoryMacroSnapshotStore(new Map<string, MacroSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMacroSnapshotStore implements MacroSnapshotStore {
  inner: MacroSnapshotStore;
  cache: cache.TtlCache<MacroSnapshot>;
  hits: number;
  misses: number;

  constructor(inner: MacroSnapshotStore, cacheValue: cache.TtlCache<MacroSnapshot>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MacroSnapshot | undefined {
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

  save(item: MacroSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MacroSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedMacroSnapshotStore(inner: MacroSnapshotStore, ttl: number, clockValue: clock.Clock): MacroSnapshotStore {
  return new CachedMacroSnapshotStore(inner, cache.newTtlCache<MacroSnapshot>(256, ttl, clockValue), 0, 0);
}

/** Selects macro snapshots. Empty fields match all. */
export class MacroSnapshotQuery {
  utmSource: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minAttempts: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MacroSnapshot): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MacroSnapshot[]): MacroSnapshot[] {
    const matched = collections.filter(items, (candidate: MacroSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMacroSnapshots(store: MacroSnapshotStore, query: MacroSnapshotQuery): MacroSnapshot[] {
  return query.apply(store.list());
}
