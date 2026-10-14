import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalStepOverride } from "./regional-step-override.js";

/** Keeps regional step overrides by code. */
export interface RegionalStepOverrideStore {
  find(code: string): RegionalStepOverride | undefined;
  save(item: RegionalStepOverride): void;
  remove(code: string): boolean;
  list(): RegionalStepOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalStepOverrideStore implements RegionalStepOverrideStore {
  items: Map<string, RegionalStepOverride>;
  order: string[];

  constructor(items: Map<string, RegionalStepOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalStepOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalStepOverride): void {
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

  list(): RegionalStepOverride[] {
    const out: RegionalStepOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalStepOverrideStore(): RegionalStepOverrideStore {
  return new MemoryRegionalStepOverrideStore(new Map<string, RegionalStepOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalStepOverrideStore implements RegionalStepOverrideStore {
  inner: RegionalStepOverrideStore;
  cache: cache.TtlCache<RegionalStepOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalStepOverrideStore,
    cacheValue: cache.TtlCache<RegionalStepOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalStepOverride | undefined {
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

  save(item: RegionalStepOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalStepOverride[] {
    return this.inner.list();
  }
}

export function newCachedRegionalStepOverrideStore(inner: RegionalStepOverrideStore, ttl: number, clockValue: clock.Clock): RegionalStepOverrideStore {
  return new CachedRegionalStepOverrideStore(
    inner,
    cache.newTtlCache<RegionalStepOverride>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional step overrides. Empty fields match all. */
export class RegionalStepOverrideQuery {
  label: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRetries: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalStepOverride): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalStepOverride[]): RegionalStepOverride[] {
    const matched = collections.filter(items, (candidate: RegionalStepOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalStepOverrides(store: RegionalStepOverrideStore, query: RegionalStepOverrideQuery): RegionalStepOverride[] {
  return query.apply(store.list());
}
