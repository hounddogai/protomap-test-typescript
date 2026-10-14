import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { NudgeRollup } from "./nudge-rollup.js";

/** Keeps nudge rollups by code. */
export interface NudgeRollupStore {
  find(code: string): NudgeRollup | undefined;
  save(item: NudgeRollup): void;
  remove(code: string): boolean;
  list(): NudgeRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryNudgeRollupStore implements NudgeRollupStore {
  items: Map<string, NudgeRollup>;
  order: string[];

  constructor(items: Map<string, NudgeRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): NudgeRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: NudgeRollup): void {
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

  list(): NudgeRollup[] {
    const out: NudgeRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryNudgeRollupStore(): NudgeRollupStore {
  return new MemoryNudgeRollupStore(new Map<string, NudgeRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedNudgeRollupStore implements NudgeRollupStore {
  inner: NudgeRollupStore;
  cache: cache.TtlCache<NudgeRollup>;
  hits: number;
  misses: number;

  constructor(inner: NudgeRollupStore, cacheValue: cache.TtlCache<NudgeRollup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): NudgeRollup | undefined {
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

  save(item: NudgeRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): NudgeRollup[] {
    return this.inner.list();
  }
}

export function newCachedNudgeRollupStore(inner: NudgeRollupStore, ttl: number, clockValue: clock.Clock): NudgeRollupStore {
  return new CachedNudgeRollupStore(inner, cache.newTtlCache<NudgeRollup>(1024, ttl, clockValue), 0, 0);
}

/** Selects nudge rollups. Empty fields match all. */
export class NudgeRollupQuery {
  name: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minImpressions: number, statuses: string[], limit: number) {
    this.name = name;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: NudgeRollup): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: NudgeRollup[]): NudgeRollup[] {
    const matched = collections.filter(items, (candidate: NudgeRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findNudgeRollups(store: NudgeRollupStore, query: NudgeRollupQuery): NudgeRollup[] {
  return query.apply(store.list());
}
