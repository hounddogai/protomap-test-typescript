import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { NudgeGroup } from "./nudge-group.js";

/** Keeps nudge groups by code. */
export interface NudgeGroupStore {
  find(code: string): NudgeGroup | undefined;
  save(item: NudgeGroup): void;
  remove(code: string): boolean;
  list(): NudgeGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryNudgeGroupStore implements NudgeGroupStore {
  items: Map<string, NudgeGroup>;
  order: string[];

  constructor(items: Map<string, NudgeGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): NudgeGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: NudgeGroup): void {
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

  list(): NudgeGroup[] {
    const out: NudgeGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryNudgeGroupStore(): NudgeGroupStore {
  return new MemoryNudgeGroupStore(new Map<string, NudgeGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedNudgeGroupStore implements NudgeGroupStore {
  inner: NudgeGroupStore;
  cache: cache.TtlCache<NudgeGroup>;
  hits: number;
  misses: number;

  constructor(inner: NudgeGroupStore, cacheValue: cache.TtlCache<NudgeGroup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): NudgeGroup | undefined {
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

  save(item: NudgeGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): NudgeGroup[] {
    return this.inner.list();
  }
}

export function newCachedNudgeGroupStore(inner: NudgeGroupStore, ttl: number, clockValue: clock.Clock): NudgeGroupStore {
  return new CachedNudgeGroupStore(inner, cache.newTtlCache<NudgeGroup>(128, ttl, clockValue), 0, 0);
}

/** Selects nudge groups. Empty fields match all. */
export class NudgeGroupQuery {
  title: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minScore: number, statuses: string[], limit: number) {
    this.title = title;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: NudgeGroup): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: NudgeGroup[]): NudgeGroup[] {
    const matched = collections.filter(items, (candidate: NudgeGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findNudgeGroups(store: NudgeGroupStore, query: NudgeGroupQuery): NudgeGroup[] {
  return query.apply(store.list());
}
