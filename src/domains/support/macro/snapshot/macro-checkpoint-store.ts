import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MacroCheckpoint } from "./macro-checkpoint.js";

/** Keeps macro checkpoints by code. */
export interface MacroCheckpointStore {
  find(code: string): MacroCheckpoint | undefined;
  save(item: MacroCheckpoint): void;
  remove(code: string): boolean;
  list(): MacroCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMacroCheckpointStore implements MacroCheckpointStore {
  items: Map<string, MacroCheckpoint>;
  order: string[];

  constructor(items: Map<string, MacroCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MacroCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MacroCheckpoint): void {
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

  list(): MacroCheckpoint[] {
    const out: MacroCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMacroCheckpointStore(): MacroCheckpointStore {
  return new MemoryMacroCheckpointStore(new Map<string, MacroCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMacroCheckpointStore implements MacroCheckpointStore {
  inner: MacroCheckpointStore;
  cache: cache.TtlCache<MacroCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: MacroCheckpointStore,
    cacheValue: cache.TtlCache<MacroCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MacroCheckpoint | undefined {
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

  save(item: MacroCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MacroCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedMacroCheckpointStore(inner: MacroCheckpointStore, ttl: number, clockValue: clock.Clock): MacroCheckpointStore {
  return new CachedMacroCheckpointStore(inner, cache.newTtlCache<MacroCheckpoint>(1024, ttl, clockValue), 0, 0);
}

/** Selects macro checkpoints. Empty fields match all. */
export class MacroCheckpointQuery {
  label: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minDiscount: number, statuses: string[], limit: number) {
    this.label = label;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MacroCheckpoint): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MacroCheckpoint[]): MacroCheckpoint[] {
    const matched = collections.filter(items, (candidate: MacroCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMacroCheckpoints(store: MacroCheckpointStore, query: MacroCheckpointQuery): MacroCheckpoint[] {
  return query.apply(store.list());
}
