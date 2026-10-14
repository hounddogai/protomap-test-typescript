import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { NudgeTier } from "./nudge-tier.js";

/** Keeps nudge tiers by code. */
export interface NudgeTierStore {
  find(code: string): NudgeTier | undefined;
  save(item: NudgeTier): void;
  remove(code: string): boolean;
  list(): NudgeTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryNudgeTierStore implements NudgeTierStore {
  items: Map<string, NudgeTier>;
  order: string[];

  constructor(items: Map<string, NudgeTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): NudgeTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: NudgeTier): void {
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

  list(): NudgeTier[] {
    const out: NudgeTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryNudgeTierStore(): NudgeTierStore {
  return new MemoryNudgeTierStore(new Map<string, NudgeTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedNudgeTierStore implements NudgeTierStore {
  inner: NudgeTierStore;
  cache: cache.TtlCache<NudgeTier>;
  hits: number;
  misses: number;

  constructor(inner: NudgeTierStore, cacheValue: cache.TtlCache<NudgeTier>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): NudgeTier | undefined {
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

  save(item: NudgeTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): NudgeTier[] {
    return this.inner.list();
  }
}

export function newCachedNudgeTierStore(inner: NudgeTierStore, ttl: number, clockValue: clock.Clock): NudgeTierStore {
  return new CachedNudgeTierStore(inner, cache.newTtlCache<NudgeTier>(256, ttl, clockValue), 0, 0);
}

/** Selects nudge tiers. Empty fields match all. */
export class NudgeTierQuery {
  source: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minFloorValue: number, statuses: string[], limit: number) {
    this.source = source;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: NudgeTier): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: NudgeTier[]): NudgeTier[] {
    const matched = collections.filter(items, (candidate: NudgeTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findNudgeTiers(store: NudgeTierStore, query: NudgeTierQuery): NudgeTier[] {
  return query.apply(store.list());
}
