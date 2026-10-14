import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MentionEstimate } from "./mention-estimate.js";

/** Keeps mention estimates by code. */
export interface MentionEstimateStore {
  find(code: string): MentionEstimate | undefined;
  save(item: MentionEstimate): void;
  remove(code: string): boolean;
  list(): MentionEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMentionEstimateStore implements MentionEstimateStore {
  items: Map<string, MentionEstimate>;
  order: string[];

  constructor(items: Map<string, MentionEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MentionEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MentionEstimate): void {
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

  list(): MentionEstimate[] {
    const out: MentionEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMentionEstimateStore(): MentionEstimateStore {
  return new MemoryMentionEstimateStore(new Map<string, MentionEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMentionEstimateStore implements MentionEstimateStore {
  inner: MentionEstimateStore;
  cache: cache.TtlCache<MentionEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: MentionEstimateStore,
    cacheValue: cache.TtlCache<MentionEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MentionEstimate | undefined {
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

  save(item: MentionEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MentionEstimate[] {
    return this.inner.list();
  }
}

export function newCachedMentionEstimateStore(inner: MentionEstimateStore, ttl: number, clockValue: clock.Clock): MentionEstimateStore {
  return new CachedMentionEstimateStore(inner, cache.newTtlCache<MentionEstimate>(1024, ttl, clockValue), 0, 0);
}

/** Selects mention estimates. Empty fields match all. */
export class MentionEstimateQuery {
  title: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCeiling: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MentionEstimate): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MentionEstimate[]): MentionEstimate[] {
    const matched = collections.filter(items, (candidate: MentionEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMentionEstimates(store: MentionEstimateStore, query: MentionEstimateQuery): MentionEstimate[] {
  return query.apply(store.list());
}
