import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LevelProfile } from "./level-profile.js";

/** Keeps level profiles by code. */
export interface LevelProfileStore {
  find(code: string): LevelProfile | undefined;
  save(item: LevelProfile): void;
  remove(code: string): boolean;
  list(): LevelProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLevelProfileStore implements LevelProfileStore {
  items: Map<string, LevelProfile>;
  order: string[];

  constructor(items: Map<string, LevelProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LevelProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LevelProfile): void {
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

  list(): LevelProfile[] {
    const out: LevelProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLevelProfileStore(): LevelProfileStore {
  return new MemoryLevelProfileStore(new Map<string, LevelProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLevelProfileStore implements LevelProfileStore {
  inner: LevelProfileStore;
  cache: cache.TtlCache<LevelProfile>;
  hits: number;
  misses: number;

  constructor(inner: LevelProfileStore, cacheValue: cache.TtlCache<LevelProfile>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LevelProfile | undefined {
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

  save(item: LevelProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LevelProfile[] {
    return this.inner.list();
  }
}

export function newCachedLevelProfileStore(inner: LevelProfileStore, ttl: number, clockValue: clock.Clock): LevelProfileStore {
  return new CachedLevelProfileStore(inner, cache.newTtlCache<LevelProfile>(128, ttl, clockValue), 0, 0);
}

/** Selects level profiles. Empty fields match all. */
export class LevelProfileQuery {
  source: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minRatio: number, statuses: string[], limit: number) {
    this.source = source;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LevelProfile): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LevelProfile[]): LevelProfile[] {
    const matched = collections.filter(items, (candidate: LevelProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLevelProfiles(store: LevelProfileStore, query: LevelProfileQuery): LevelProfile[] {
  return query.apply(store.list());
}
