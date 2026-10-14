import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SenderVariance } from "./sender-variance.js";

/** Keeps sender variances by code. */
export interface SenderVarianceStore {
  find(code: string): SenderVariance | undefined;
  save(item: SenderVariance): void;
  remove(code: string): boolean;
  list(): SenderVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySenderVarianceStore implements SenderVarianceStore {
  items: Map<string, SenderVariance>;
  order: string[];

  constructor(items: Map<string, SenderVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SenderVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SenderVariance): void {
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

  list(): SenderVariance[] {
    const out: SenderVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySenderVarianceStore(): SenderVarianceStore {
  return new MemorySenderVarianceStore(new Map<string, SenderVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSenderVarianceStore implements SenderVarianceStore {
  inner: SenderVarianceStore;
  cache: cache.TtlCache<SenderVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: SenderVarianceStore,
    cacheValue: cache.TtlCache<SenderVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SenderVariance | undefined {
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

  save(item: SenderVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SenderVariance[] {
    return this.inner.list();
  }
}

export function newCachedSenderVarianceStore(inner: SenderVarianceStore, ttl: number, clockValue: clock.Clock): SenderVarianceStore {
  return new CachedSenderVarianceStore(inner, cache.newTtlCache<SenderVariance>(256, ttl, clockValue), 0, 0);
}

/** Selects sender variances. Empty fields match all. */
export class SenderVarianceQuery {
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

  matches(item: SenderVariance): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SenderVariance[]): SenderVariance[] {
    const matched = collections.filter(items, (candidate: SenderVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSenderVariances(store: SenderVarianceStore, query: SenderVarianceQuery): SenderVariance[] {
  return query.apply(store.list());
}
