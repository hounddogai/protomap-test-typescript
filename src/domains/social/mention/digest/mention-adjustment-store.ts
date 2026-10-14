import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MentionAdjustment } from "./mention-adjustment.js";

/** Keeps mention adjustments by code. */
export interface MentionAdjustmentStore {
  find(code: string): MentionAdjustment | undefined;
  save(item: MentionAdjustment): void;
  remove(code: string): boolean;
  list(): MentionAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMentionAdjustmentStore implements MentionAdjustmentStore {
  items: Map<string, MentionAdjustment>;
  order: string[];

  constructor(items: Map<string, MentionAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MentionAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MentionAdjustment): void {
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

  list(): MentionAdjustment[] {
    const out: MentionAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMentionAdjustmentStore(): MentionAdjustmentStore {
  return new MemoryMentionAdjustmentStore(new Map<string, MentionAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMentionAdjustmentStore implements MentionAdjustmentStore {
  inner: MentionAdjustmentStore;
  cache: cache.TtlCache<MentionAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: MentionAdjustmentStore,
    cacheValue: cache.TtlCache<MentionAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MentionAdjustment | undefined {
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

  save(item: MentionAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MentionAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedMentionAdjustmentStore(inner: MentionAdjustmentStore, ttl: number, clockValue: clock.Clock): MentionAdjustmentStore {
  return new CachedMentionAdjustmentStore(inner, cache.newTtlCache<MentionAdjustment>(64, ttl, clockValue), 0, 0);
}

/** Selects mention adjustments. Empty fields match all. */
export class MentionAdjustmentQuery {
  utmSource: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minDiscount: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MentionAdjustment): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MentionAdjustment[]): MentionAdjustment[] {
    const matched = collections.filter(items, (candidate: MentionAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMentionAdjustments(store: MentionAdjustmentStore, query: MentionAdjustmentQuery): MentionAdjustment[] {
  return query.apply(store.list());
}
