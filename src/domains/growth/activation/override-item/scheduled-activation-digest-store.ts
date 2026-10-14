import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledActivationDigest } from "./scheduled-activation-digest.js";

/** Keeps scheduled activation digests by code. */
export interface ScheduledActivationDigestStore {
  find(code: string): ScheduledActivationDigest | undefined;
  save(item: ScheduledActivationDigest): void;
  remove(code: string): boolean;
  list(): ScheduledActivationDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledActivationDigestStore implements ScheduledActivationDigestStore {
  items: Map<string, ScheduledActivationDigest>;
  order: string[];

  constructor(items: Map<string, ScheduledActivationDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledActivationDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledActivationDigest): void {
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

  list(): ScheduledActivationDigest[] {
    const out: ScheduledActivationDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledActivationDigestStore(): ScheduledActivationDigestStore {
  return new MemoryScheduledActivationDigestStore(new Map<string, ScheduledActivationDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledActivationDigestStore implements ScheduledActivationDigestStore {
  inner: ScheduledActivationDigestStore;
  cache: cache.TtlCache<ScheduledActivationDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledActivationDigestStore,
    cacheValue: cache.TtlCache<ScheduledActivationDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledActivationDigest | undefined {
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

  save(item: ScheduledActivationDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledActivationDigest[] {
    return this.inner.list();
  }
}

export function newCachedScheduledActivationDigestStore(inner: ScheduledActivationDigestStore, ttl: number, clockValue: clock.Clock): ScheduledActivationDigestStore {
  return new CachedScheduledActivationDigestStore(
    inner,
    cache.newTtlCache<ScheduledActivationDigest>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled activation digests. Empty fields match all. */
export class ScheduledActivationDigestQuery {
  name: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledActivationDigest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledActivationDigest[]): ScheduledActivationDigest[] {
    const matched = collections.filter(items, (candidate: ScheduledActivationDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledActivationDigests(store: ScheduledActivationDigestStore, query: ScheduledActivationDigestQuery): ScheduledActivationDigest[] {
  return query.apply(store.list());
}
