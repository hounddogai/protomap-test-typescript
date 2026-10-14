import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InviteThreshold } from "./invite-threshold.js";

/** Keeps invite thresholds by code. */
export interface InviteThresholdStore {
  find(code: string): InviteThreshold | undefined;
  save(item: InviteThreshold): void;
  remove(code: string): boolean;
  list(): InviteThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInviteThresholdStore implements InviteThresholdStore {
  items: Map<string, InviteThreshold>;
  order: string[];

  constructor(items: Map<string, InviteThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InviteThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InviteThreshold): void {
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

  list(): InviteThreshold[] {
    const out: InviteThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInviteThresholdStore(): InviteThresholdStore {
  return new MemoryInviteThresholdStore(new Map<string, InviteThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInviteThresholdStore implements InviteThresholdStore {
  inner: InviteThresholdStore;
  cache: cache.TtlCache<InviteThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: InviteThresholdStore,
    cacheValue: cache.TtlCache<InviteThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InviteThreshold | undefined {
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

  save(item: InviteThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InviteThreshold[] {
    return this.inner.list();
  }
}

export function newCachedInviteThresholdStore(inner: InviteThresholdStore, ttl: number, clockValue: clock.Clock): InviteThresholdStore {
  return new CachedInviteThresholdStore(inner, cache.newTtlCache<InviteThreshold>(1024, ttl, clockValue), 0, 0);
}

/** Selects invite thresholds. Empty fields match all. */
export class InviteThresholdQuery {
  title: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRevision: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InviteThreshold): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InviteThreshold[]): InviteThreshold[] {
    const matched = collections.filter(items, (candidate: InviteThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInviteThresholds(store: InviteThresholdStore, query: InviteThresholdQuery): InviteThreshold[] {
  return query.apply(store.list());
}
