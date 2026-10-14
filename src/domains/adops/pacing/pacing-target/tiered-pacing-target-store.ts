import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredPacingTarget } from "./tiered-pacing-target.js";

/** Keeps tiered pacing targets by code. */
export interface TieredPacingTargetStore {
  find(code: string): TieredPacingTarget | undefined;
  save(item: TieredPacingTarget): void;
  remove(code: string): boolean;
  list(): TieredPacingTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredPacingTargetStore implements TieredPacingTargetStore {
  items: Map<string, TieredPacingTarget>;
  order: string[];

  constructor(items: Map<string, TieredPacingTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredPacingTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredPacingTarget): void {
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

  list(): TieredPacingTarget[] {
    const out: TieredPacingTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredPacingTargetStore(): TieredPacingTargetStore {
  return new MemoryTieredPacingTargetStore(new Map<string, TieredPacingTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredPacingTargetStore implements TieredPacingTargetStore {
  inner: TieredPacingTargetStore;
  cache: cache.TtlCache<TieredPacingTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredPacingTargetStore,
    cacheValue: cache.TtlCache<TieredPacingTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredPacingTarget | undefined {
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

  save(item: TieredPacingTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredPacingTarget[] {
    return this.inner.list();
  }
}

export function newCachedTieredPacingTargetStore(inner: TieredPacingTargetStore, ttl: number, clockValue: clock.Clock): TieredPacingTargetStore {
  return new CachedTieredPacingTargetStore(inner, cache.newTtlCache<TieredPacingTarget>(128, ttl, clockValue), 0, 0);
}

/** Selects tiered pacing targets. Empty fields match all. */
export class TieredPacingTargetQuery {
  channel: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minSendAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredPacingTarget): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredPacingTarget[]): TieredPacingTarget[] {
    const matched = collections.filter(items, (candidate: TieredPacingTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredPacingTargets(store: TieredPacingTargetStore, query: TieredPacingTargetQuery): TieredPacingTarget[] {
  return query.apply(store.list());
}
