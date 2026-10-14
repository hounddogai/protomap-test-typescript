import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyPreferencePolicy } from "./legacy-preference-policy.js";

/** Keeps legacy preference policies by code. */
export interface LegacyPreferencePolicyStore {
  find(code: string): LegacyPreferencePolicy | undefined;
  save(item: LegacyPreferencePolicy): void;
  remove(code: string): boolean;
  list(): LegacyPreferencePolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyPreferencePolicyStore implements LegacyPreferencePolicyStore {
  items: Map<string, LegacyPreferencePolicy>;
  order: string[];

  constructor(items: Map<string, LegacyPreferencePolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyPreferencePolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyPreferencePolicy): void {
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

  list(): LegacyPreferencePolicy[] {
    const out: LegacyPreferencePolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyPreferencePolicyStore(): LegacyPreferencePolicyStore {
  return new MemoryLegacyPreferencePolicyStore(new Map<string, LegacyPreferencePolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyPreferencePolicyStore implements LegacyPreferencePolicyStore {
  inner: LegacyPreferencePolicyStore;
  cache: cache.TtlCache<LegacyPreferencePolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyPreferencePolicyStore,
    cacheValue: cache.TtlCache<LegacyPreferencePolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyPreferencePolicy | undefined {
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

  save(item: LegacyPreferencePolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyPreferencePolicy[] {
    return this.inner.list();
  }
}

export function newCachedLegacyPreferencePolicyStore(inner: LegacyPreferencePolicyStore, ttl: number, clockValue: clock.Clock): LegacyPreferencePolicyStore {
  return new CachedLegacyPreferencePolicyStore(
    inner,
    cache.newTtlCache<LegacyPreferencePolicy>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy preference policies. Empty fields match all. */
export class LegacyPreferencePolicyQuery {
  label: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minVersion: number, statuses: string[], limit: number) {
    this.label = label;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyPreferencePolicy): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyPreferencePolicy[]): LegacyPreferencePolicy[] {
    const matched = collections.filter(items, (candidate: LegacyPreferencePolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyPreferencePolicies(store: LegacyPreferencePolicyStore, query: LegacyPreferencePolicyQuery): LegacyPreferencePolicy[] {
  return query.apply(store.list());
}
