import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LevelTarget } from "./level-target.js";

/** Keeps level targets by code. */
export interface LevelTargetStore {
  find(code: string): LevelTarget | undefined;
  save(item: LevelTarget): void;
  remove(code: string): boolean;
  list(): LevelTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLevelTargetStore implements LevelTargetStore {
  items: Map<string, LevelTarget>;
  order: string[];

  constructor(items: Map<string, LevelTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LevelTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LevelTarget): void {
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

  list(): LevelTarget[] {
    const out: LevelTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLevelTargetStore(): LevelTargetStore {
  return new MemoryLevelTargetStore(new Map<string, LevelTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLevelTargetStore implements LevelTargetStore {
  inner: LevelTargetStore;
  cache: cache.TtlCache<LevelTarget>;
  hits: number;
  misses: number;

  constructor(inner: LevelTargetStore, cacheValue: cache.TtlCache<LevelTarget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LevelTarget | undefined {
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

  save(item: LevelTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LevelTarget[] {
    return this.inner.list();
  }
}

export function newCachedLevelTargetStore(inner: LevelTargetStore, ttl: number, clockValue: clock.Clock): LevelTargetStore {
  return new CachedLevelTargetStore(inner, cache.newTtlCache<LevelTarget>(128, ttl, clockValue), 0, 0);
}

/** Selects level targets. Empty fields match all. */
export class LevelTargetQuery {
  label: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minWeight: number, statuses: string[], limit: number) {
    this.label = label;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LevelTarget): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LevelTarget[]): LevelTarget[] {
    const matched = collections.filter(items, (candidate: LevelTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLevelTargets(store: LevelTargetStore, query: LevelTargetQuery): LevelTarget[] {
  return query.apply(store.list());
}
