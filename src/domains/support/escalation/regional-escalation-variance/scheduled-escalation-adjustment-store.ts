import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledEscalationAdjustment } from "./scheduled-escalation-adjustment.js";

/** Keeps scheduled escalation adjustments by code. */
export interface ScheduledEscalationAdjustmentStore {
  find(code: string): ScheduledEscalationAdjustment | undefined;
  save(item: ScheduledEscalationAdjustment): void;
  remove(code: string): boolean;
  list(): ScheduledEscalationAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledEscalationAdjustmentStore implements ScheduledEscalationAdjustmentStore {
  items: Map<string, ScheduledEscalationAdjustment>;
  order: string[];

  constructor(items: Map<string, ScheduledEscalationAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledEscalationAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledEscalationAdjustment): void {
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

  list(): ScheduledEscalationAdjustment[] {
    const out: ScheduledEscalationAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledEscalationAdjustmentStore(): ScheduledEscalationAdjustmentStore {
  return new MemoryScheduledEscalationAdjustmentStore(new Map<string, ScheduledEscalationAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledEscalationAdjustmentStore implements ScheduledEscalationAdjustmentStore {
  inner: ScheduledEscalationAdjustmentStore;
  cache: cache.TtlCache<ScheduledEscalationAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledEscalationAdjustmentStore,
    cacheValue: cache.TtlCache<ScheduledEscalationAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledEscalationAdjustment | undefined {
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

  save(item: ScheduledEscalationAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledEscalationAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedScheduledEscalationAdjustmentStore(inner: ScheduledEscalationAdjustmentStore, ttl: number, clockValue: clock.Clock): ScheduledEscalationAdjustmentStore {
  return new CachedScheduledEscalationAdjustmentStore(
    inner,
    cache.newTtlCache<ScheduledEscalationAdjustment>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled escalation adjustments. Empty fields match all. */
export class ScheduledEscalationAdjustmentQuery {
  name: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minScore: number, statuses: string[], limit: number) {
    this.name = name;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledEscalationAdjustment): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledEscalationAdjustment[]): ScheduledEscalationAdjustment[] {
    const matched = collections.filter(items, (candidate: ScheduledEscalationAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledEscalationAdjustments(store: ScheduledEscalationAdjustmentStore, query: ScheduledEscalationAdjustmentQuery): ScheduledEscalationAdjustment[] {
  return query.apply(store.list());
}
