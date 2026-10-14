import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EscalationAdjustment } from "./escalation-adjustment.js";

/** Keeps escalation adjustments by code. */
export interface EscalationAdjustmentStore {
  find(code: string): EscalationAdjustment | undefined;
  save(item: EscalationAdjustment): void;
  remove(code: string): boolean;
  list(): EscalationAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEscalationAdjustmentStore implements EscalationAdjustmentStore {
  items: Map<string, EscalationAdjustment>;
  order: string[];

  constructor(items: Map<string, EscalationAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EscalationAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EscalationAdjustment): void {
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

  list(): EscalationAdjustment[] {
    const out: EscalationAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEscalationAdjustmentStore(): EscalationAdjustmentStore {
  return new MemoryEscalationAdjustmentStore(new Map<string, EscalationAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEscalationAdjustmentStore implements EscalationAdjustmentStore {
  inner: EscalationAdjustmentStore;
  cache: cache.TtlCache<EscalationAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: EscalationAdjustmentStore,
    cacheValue: cache.TtlCache<EscalationAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EscalationAdjustment | undefined {
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

  save(item: EscalationAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EscalationAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedEscalationAdjustmentStore(inner: EscalationAdjustmentStore, ttl: number, clockValue: clock.Clock): EscalationAdjustmentStore {
  return new CachedEscalationAdjustmentStore(
    inner,
    cache.newTtlCache<EscalationAdjustment>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects escalation adjustments. Empty fields match all. */
export class EscalationAdjustmentQuery {
  channel: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRevision: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EscalationAdjustment): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EscalationAdjustment[]): EscalationAdjustment[] {
    const matched = collections.filter(items, (candidate: EscalationAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEscalationAdjustments(store: EscalationAdjustmentStore, query: EscalationAdjustmentQuery): EscalationAdjustment[] {
  return query.apply(store.list());
}
