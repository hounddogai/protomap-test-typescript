import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PacingPolicy } from "./pacing-policy.js";

/** Keeps pacing policies by code. */
export interface PacingPolicyStore {
  find(code: string): PacingPolicy | undefined;
  save(item: PacingPolicy): void;
  remove(code: string): boolean;
  list(): PacingPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPacingPolicyStore implements PacingPolicyStore {
  items: Map<string, PacingPolicy>;
  order: string[];

  constructor(items: Map<string, PacingPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PacingPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PacingPolicy): void {
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

  list(): PacingPolicy[] {
    const out: PacingPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPacingPolicyStore(): PacingPolicyStore {
  return new MemoryPacingPolicyStore(new Map<string, PacingPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPacingPolicyStore implements PacingPolicyStore {
  inner: PacingPolicyStore;
  cache: cache.TtlCache<PacingPolicy>;
  hits: number;
  misses: number;

  constructor(inner: PacingPolicyStore, cacheValue: cache.TtlCache<PacingPolicy>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PacingPolicy | undefined {
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

  save(item: PacingPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PacingPolicy[] {
    return this.inner.list();
  }
}

export function newCachedPacingPolicyStore(inner: PacingPolicyStore, ttl: number, clockValue: clock.Clock): PacingPolicyStore {
  return new CachedPacingPolicyStore(inner, cache.newTtlCache<PacingPolicy>(128, ttl, clockValue), 0, 0);
}

/** Selects pacing policies. Empty fields match all. */
export class PacingPolicyQuery {
  channel: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minFloorValue: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PacingPolicy): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PacingPolicy[]): PacingPolicy[] {
    const matched = collections.filter(items, (candidate: PacingPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPacingPolicies(store: PacingPolicyStore, query: PacingPolicyQuery): PacingPolicy[] {
  return query.apply(store.list());
}
