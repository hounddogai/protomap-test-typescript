import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyInviteAdjustment } from "./legacy-invite-adjustment.js";

/** Keeps legacy invite adjustments by code. */
export interface LegacyInviteAdjustmentStore {
  find(code: string): LegacyInviteAdjustment | undefined;
  save(item: LegacyInviteAdjustment): void;
  remove(code: string): boolean;
  list(): LegacyInviteAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyInviteAdjustmentStore implements LegacyInviteAdjustmentStore {
  items: Map<string, LegacyInviteAdjustment>;
  order: string[];

  constructor(items: Map<string, LegacyInviteAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyInviteAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyInviteAdjustment): void {
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

  list(): LegacyInviteAdjustment[] {
    const out: LegacyInviteAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyInviteAdjustmentStore(): LegacyInviteAdjustmentStore {
  return new MemoryLegacyInviteAdjustmentStore(new Map<string, LegacyInviteAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyInviteAdjustmentStore implements LegacyInviteAdjustmentStore {
  inner: LegacyInviteAdjustmentStore;
  cache: cache.TtlCache<LegacyInviteAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyInviteAdjustmentStore,
    cacheValue: cache.TtlCache<LegacyInviteAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyInviteAdjustment | undefined {
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

  save(item: LegacyInviteAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyInviteAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedLegacyInviteAdjustmentStore(inner: LegacyInviteAdjustmentStore, ttl: number, clockValue: clock.Clock): LegacyInviteAdjustmentStore {
  return new CachedLegacyInviteAdjustmentStore(
    inner,
    cache.newTtlCache<LegacyInviteAdjustment>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy invite adjustments. Empty fields match all. */
export class LegacyInviteAdjustmentQuery {
  name: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minMinimum: number, statuses: string[], limit: number) {
    this.name = name;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyInviteAdjustment): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyInviteAdjustment[]): LegacyInviteAdjustment[] {
    const matched = collections.filter(items, (candidate: LegacyInviteAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyInviteAdjustments(store: LegacyInviteAdjustmentStore, query: LegacyInviteAdjustmentQuery): LegacyInviteAdjustment[] {
  return query.apply(store.list());
}
