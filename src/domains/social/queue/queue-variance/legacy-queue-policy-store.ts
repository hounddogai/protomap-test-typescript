import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyQueuePolicy } from "./legacy-queue-policy.js";

/** Keeps legacy queue policies by code. */
export interface LegacyQueuePolicyStore {
  find(code: string): LegacyQueuePolicy | undefined;
  save(item: LegacyQueuePolicy): void;
  remove(code: string): boolean;
  list(): LegacyQueuePolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyQueuePolicyStore implements LegacyQueuePolicyStore {
  items: Map<string, LegacyQueuePolicy>;
  order: string[];

  constructor(items: Map<string, LegacyQueuePolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyQueuePolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyQueuePolicy): void {
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

  list(): LegacyQueuePolicy[] {
    const out: LegacyQueuePolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyQueuePolicyStore(): LegacyQueuePolicyStore {
  return new MemoryLegacyQueuePolicyStore(new Map<string, LegacyQueuePolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyQueuePolicyStore implements LegacyQueuePolicyStore {
  inner: LegacyQueuePolicyStore;
  cache: cache.TtlCache<LegacyQueuePolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyQueuePolicyStore,
    cacheValue: cache.TtlCache<LegacyQueuePolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyQueuePolicy | undefined {
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

  save(item: LegacyQueuePolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyQueuePolicy[] {
    return this.inner.list();
  }
}

export function newCachedLegacyQueuePolicyStore(inner: LegacyQueuePolicyStore, ttl: number, clockValue: clock.Clock): LegacyQueuePolicyStore {
  return new CachedLegacyQueuePolicyStore(inner, cache.newTtlCache<LegacyQueuePolicy>(256, ttl, clockValue), 0, 0);
}

/** Selects legacy queue policies. Empty fields match all. */
export class LegacyQueuePolicyQuery {
  source: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minSendAt: number, statuses: string[], limit: number) {
    this.source = source;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyQueuePolicy): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyQueuePolicy[]): LegacyQueuePolicy[] {
    const matched = collections.filter(items, (candidate: LegacyQueuePolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyQueuePolicies(store: LegacyQueuePolicyStore, query: LegacyQueuePolicyQuery): LegacyQueuePolicy[] {
  return query.apply(store.list());
}
