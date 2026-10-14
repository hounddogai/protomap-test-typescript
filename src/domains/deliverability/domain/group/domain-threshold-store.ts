import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DomainThreshold } from "./domain-threshold.js";

/** Keeps domain thresholds by code. */
export interface DomainThresholdStore {
  find(code: string): DomainThreshold | undefined;
  save(item: DomainThreshold): void;
  remove(code: string): boolean;
  list(): DomainThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDomainThresholdStore implements DomainThresholdStore {
  items: Map<string, DomainThreshold>;
  order: string[];

  constructor(items: Map<string, DomainThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DomainThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DomainThreshold): void {
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

  list(): DomainThreshold[] {
    const out: DomainThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDomainThresholdStore(): DomainThresholdStore {
  return new MemoryDomainThresholdStore(new Map<string, DomainThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDomainThresholdStore implements DomainThresholdStore {
  inner: DomainThresholdStore;
  cache: cache.TtlCache<DomainThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: DomainThresholdStore,
    cacheValue: cache.TtlCache<DomainThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DomainThreshold | undefined {
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

  save(item: DomainThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DomainThreshold[] {
    return this.inner.list();
  }
}

export function newCachedDomainThresholdStore(inner: DomainThresholdStore, ttl: number, clockValue: clock.Clock): DomainThresholdStore {
  return new CachedDomainThresholdStore(inner, cache.newTtlCache<DomainThreshold>(512, ttl, clockValue), 0, 0);
}

/** Selects domain thresholds. Empty fields match all. */
export class DomainThresholdQuery {
  channel: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DomainThreshold): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DomainThreshold[]): DomainThreshold[] {
    const matched = collections.filter(items, (candidate: DomainThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDomainThresholds(store: DomainThresholdStore, query: DomainThresholdQuery): DomainThreshold[] {
  return query.apply(store.list());
}
