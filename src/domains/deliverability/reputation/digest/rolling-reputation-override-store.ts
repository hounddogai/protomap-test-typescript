import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingReputationOverride } from "./rolling-reputation-override.js";

/** Keeps rolling reputation overrides by code. */
export interface RollingReputationOverrideStore {
  find(code: string): RollingReputationOverride | undefined;
  save(item: RollingReputationOverride): void;
  remove(code: string): boolean;
  list(): RollingReputationOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingReputationOverrideStore implements RollingReputationOverrideStore {
  items: Map<string, RollingReputationOverride>;
  order: string[];

  constructor(items: Map<string, RollingReputationOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingReputationOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingReputationOverride): void {
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

  list(): RollingReputationOverride[] {
    const out: RollingReputationOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingReputationOverrideStore(): RollingReputationOverrideStore {
  return new MemoryRollingReputationOverrideStore(new Map<string, RollingReputationOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingReputationOverrideStore implements RollingReputationOverrideStore {
  inner: RollingReputationOverrideStore;
  cache: cache.TtlCache<RollingReputationOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingReputationOverrideStore,
    cacheValue: cache.TtlCache<RollingReputationOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingReputationOverride | undefined {
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

  save(item: RollingReputationOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingReputationOverride[] {
    return this.inner.list();
  }
}

export function newCachedRollingReputationOverrideStore(inner: RollingReputationOverrideStore, ttl: number, clockValue: clock.Clock): RollingReputationOverrideStore {
  return new CachedRollingReputationOverrideStore(
    inner,
    cache.newTtlCache<RollingReputationOverride>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling reputation overrides. Empty fields match all. */
export class RollingReputationOverrideQuery {
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

  matches(item: RollingReputationOverride): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingReputationOverride[]): RollingReputationOverride[] {
    const matched = collections.filter(items, (candidate: RollingReputationOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingReputationOverrides(store: RollingReputationOverrideStore, query: RollingReputationOverrideQuery): RollingReputationOverride[] {
  return query.apply(store.list());
}
