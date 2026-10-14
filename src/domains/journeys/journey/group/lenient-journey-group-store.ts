import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientJourneyGroup } from "./lenient-journey-group.js";

/** Keeps lenient journey groups by code. */
export interface LenientJourneyGroupStore {
  find(code: string): LenientJourneyGroup | undefined;
  save(item: LenientJourneyGroup): void;
  remove(code: string): boolean;
  list(): LenientJourneyGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientJourneyGroupStore implements LenientJourneyGroupStore {
  items: Map<string, LenientJourneyGroup>;
  order: string[];

  constructor(items: Map<string, LenientJourneyGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientJourneyGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientJourneyGroup): void {
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

  list(): LenientJourneyGroup[] {
    const out: LenientJourneyGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientJourneyGroupStore(): LenientJourneyGroupStore {
  return new MemoryLenientJourneyGroupStore(new Map<string, LenientJourneyGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientJourneyGroupStore implements LenientJourneyGroupStore {
  inner: LenientJourneyGroupStore;
  cache: cache.TtlCache<LenientJourneyGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientJourneyGroupStore,
    cacheValue: cache.TtlCache<LenientJourneyGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientJourneyGroup | undefined {
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

  save(item: LenientJourneyGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientJourneyGroup[] {
    return this.inner.list();
  }
}

export function newCachedLenientJourneyGroupStore(inner: LenientJourneyGroupStore, ttl: number, clockValue: clock.Clock): LenientJourneyGroupStore {
  return new CachedLenientJourneyGroupStore(inner, cache.newTtlCache<LenientJourneyGroup>(64, ttl, clockValue), 0, 0);
}

/** Selects lenient journey groups. Empty fields match all. */
export class LenientJourneyGroupQuery {
  title: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minStartsAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientJourneyGroup): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientJourneyGroup[]): LenientJourneyGroup[] {
    const matched = collections.filter(items, (candidate: LenientJourneyGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientJourneyGroups(store: LenientJourneyGroupStore, query: LenientJourneyGroupQuery): LenientJourneyGroup[] {
  return query.apply(store.list());
}
