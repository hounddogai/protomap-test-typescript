import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReputationException } from "./reputation-exception.js";

/** Keeps reputation exceptions by code. */
export interface ReputationExceptionStore {
  find(code: string): ReputationException | undefined;
  save(item: ReputationException): void;
  remove(code: string): boolean;
  list(): ReputationException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReputationExceptionStore implements ReputationExceptionStore {
  items: Map<string, ReputationException>;
  order: string[];

  constructor(items: Map<string, ReputationException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReputationException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReputationException): void {
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

  list(): ReputationException[] {
    const out: ReputationException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReputationExceptionStore(): ReputationExceptionStore {
  return new MemoryReputationExceptionStore(new Map<string, ReputationException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReputationExceptionStore implements ReputationExceptionStore {
  inner: ReputationExceptionStore;
  cache: cache.TtlCache<ReputationException>;
  hits: number;
  misses: number;

  constructor(
    inner: ReputationExceptionStore,
    cacheValue: cache.TtlCache<ReputationException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReputationException | undefined {
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

  save(item: ReputationException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReputationException[] {
    return this.inner.list();
  }
}

export function newCachedReputationExceptionStore(inner: ReputationExceptionStore, ttl: number, clockValue: clock.Clock): ReputationExceptionStore {
  return new CachedReputationExceptionStore(inner, cache.newTtlCache<ReputationException>(128, ttl, clockValue), 0, 0);
}

/** Selects reputation exceptions. Empty fields match all. */
export class ReputationExceptionQuery {
  label: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minImpressions: number, statuses: string[], limit: number) {
    this.label = label;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReputationException): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReputationException[]): ReputationException[] {
    const matched = collections.filter(items, (candidate: ReputationException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReputationExceptions(store: ReputationExceptionStore, query: ReputationExceptionQuery): ReputationException[] {
  return query.apply(store.list());
}
