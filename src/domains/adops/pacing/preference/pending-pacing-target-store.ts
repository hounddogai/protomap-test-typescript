import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingPacingTarget } from "./pending-pacing-target.js";

/** Keeps pending pacing targets by code. */
export interface PendingPacingTargetStore {
  find(code: string): PendingPacingTarget | undefined;
  save(item: PendingPacingTarget): void;
  remove(code: string): boolean;
  list(): PendingPacingTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingPacingTargetStore implements PendingPacingTargetStore {
  items: Map<string, PendingPacingTarget>;
  order: string[];

  constructor(items: Map<string, PendingPacingTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingPacingTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingPacingTarget): void {
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

  list(): PendingPacingTarget[] {
    const out: PendingPacingTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingPacingTargetStore(): PendingPacingTargetStore {
  return new MemoryPendingPacingTargetStore(new Map<string, PendingPacingTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingPacingTargetStore implements PendingPacingTargetStore {
  inner: PendingPacingTargetStore;
  cache: cache.TtlCache<PendingPacingTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingPacingTargetStore,
    cacheValue: cache.TtlCache<PendingPacingTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingPacingTarget | undefined {
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

  save(item: PendingPacingTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingPacingTarget[] {
    return this.inner.list();
  }
}

export function newCachedPendingPacingTargetStore(inner: PendingPacingTargetStore, ttl: number, clockValue: clock.Clock): PendingPacingTargetStore {
  return new CachedPendingPacingTargetStore(inner, cache.newTtlCache<PendingPacingTarget>(1024, ttl, clockValue), 0, 0);
}

/** Selects pending pacing targets. Empty fields match all. */
export class PendingPacingTargetQuery {
  name: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.name = name;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingPacingTarget): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingPacingTarget[]): PendingPacingTarget[] {
    const matched = collections.filter(items, (candidate: PendingPacingTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingPacingTargets(store: PendingPacingTargetStore, query: PendingPacingTargetQuery): PendingPacingTarget[] {
  return query.apply(store.list());
}
