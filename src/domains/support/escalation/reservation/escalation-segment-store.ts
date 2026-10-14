import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EscalationSegment } from "./escalation-segment.js";

/** Keeps escalation segments by code. */
export interface EscalationSegmentStore {
  find(code: string): EscalationSegment | undefined;
  save(item: EscalationSegment): void;
  remove(code: string): boolean;
  list(): EscalationSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEscalationSegmentStore implements EscalationSegmentStore {
  items: Map<string, EscalationSegment>;
  order: string[];

  constructor(items: Map<string, EscalationSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EscalationSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EscalationSegment): void {
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

  list(): EscalationSegment[] {
    const out: EscalationSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEscalationSegmentStore(): EscalationSegmentStore {
  return new MemoryEscalationSegmentStore(new Map<string, EscalationSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEscalationSegmentStore implements EscalationSegmentStore {
  inner: EscalationSegmentStore;
  cache: cache.TtlCache<EscalationSegment>;
  hits: number;
  misses: number;

  constructor(
    inner: EscalationSegmentStore,
    cacheValue: cache.TtlCache<EscalationSegment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EscalationSegment | undefined {
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

  save(item: EscalationSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EscalationSegment[] {
    return this.inner.list();
  }
}

export function newCachedEscalationSegmentStore(inner: EscalationSegmentStore, ttl: number, clockValue: clock.Clock): EscalationSegmentStore {
  return new CachedEscalationSegmentStore(inner, cache.newTtlCache<EscalationSegment>(64, ttl, clockValue), 0, 0);
}

/** Selects escalation segments. Empty fields match all. */
export class EscalationSegmentQuery {
  name: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minThreshold: number, statuses: string[], limit: number) {
    this.name = name;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EscalationSegment): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EscalationSegment[]): EscalationSegment[] {
    const matched = collections.filter(items, (candidate: EscalationSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEscalationSegments(store: EscalationSegmentStore, query: EscalationSegmentQuery): EscalationSegment[] {
  return query.apply(store.list());
}
