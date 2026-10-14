import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ComplaintOverride } from "./complaint-override.js";

/** Keeps complaint overrides by code. */
export interface ComplaintOverrideStore {
  find(code: string): ComplaintOverride | undefined;
  save(item: ComplaintOverride): void;
  remove(code: string): boolean;
  list(): ComplaintOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryComplaintOverrideStore implements ComplaintOverrideStore {
  items: Map<string, ComplaintOverride>;
  order: string[];

  constructor(items: Map<string, ComplaintOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ComplaintOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ComplaintOverride): void {
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

  list(): ComplaintOverride[] {
    const out: ComplaintOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryComplaintOverrideStore(): ComplaintOverrideStore {
  return new MemoryComplaintOverrideStore(new Map<string, ComplaintOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedComplaintOverrideStore implements ComplaintOverrideStore {
  inner: ComplaintOverrideStore;
  cache: cache.TtlCache<ComplaintOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: ComplaintOverrideStore,
    cacheValue: cache.TtlCache<ComplaintOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ComplaintOverride | undefined {
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

  save(item: ComplaintOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ComplaintOverride[] {
    return this.inner.list();
  }
}

export function newCachedComplaintOverrideStore(inner: ComplaintOverrideStore, ttl: number, clockValue: clock.Clock): ComplaintOverrideStore {
  return new CachedComplaintOverrideStore(inner, cache.newTtlCache<ComplaintOverride>(1024, ttl, clockValue), 0, 0);
}

/** Selects complaint overrides. Empty fields match all. */
export class ComplaintOverrideQuery {
  label: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.label = label;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ComplaintOverride): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ComplaintOverride[]): ComplaintOverride[] {
    const matched = collections.filter(items, (candidate: ComplaintOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findComplaintOverrides(store: ComplaintOverrideStore, query: ComplaintOverrideQuery): ComplaintOverride[] {
  return query.apply(store.list());
}
