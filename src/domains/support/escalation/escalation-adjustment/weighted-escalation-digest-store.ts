import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedEscalationDigest } from "./weighted-escalation-digest.js";

/** Keeps weighted escalation digests by code. */
export interface WeightedEscalationDigestStore {
  find(code: string): WeightedEscalationDigest | undefined;
  save(item: WeightedEscalationDigest): void;
  remove(code: string): boolean;
  list(): WeightedEscalationDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedEscalationDigestStore implements WeightedEscalationDigestStore {
  items: Map<string, WeightedEscalationDigest>;
  order: string[];

  constructor(items: Map<string, WeightedEscalationDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedEscalationDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedEscalationDigest): void {
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

  list(): WeightedEscalationDigest[] {
    const out: WeightedEscalationDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedEscalationDigestStore(): WeightedEscalationDigestStore {
  return new MemoryWeightedEscalationDigestStore(new Map<string, WeightedEscalationDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedEscalationDigestStore implements WeightedEscalationDigestStore {
  inner: WeightedEscalationDigestStore;
  cache: cache.TtlCache<WeightedEscalationDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedEscalationDigestStore,
    cacheValue: cache.TtlCache<WeightedEscalationDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedEscalationDigest | undefined {
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

  save(item: WeightedEscalationDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedEscalationDigest[] {
    return this.inner.list();
  }
}

export function newCachedWeightedEscalationDigestStore(inner: WeightedEscalationDigestStore, ttl: number, clockValue: clock.Clock): WeightedEscalationDigestStore {
  return new CachedWeightedEscalationDigestStore(
    inner,
    cache.newTtlCache<WeightedEscalationDigest>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted escalation digests. Empty fields match all. */
export class WeightedEscalationDigestQuery {
  label: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBudget: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedEscalationDigest): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedEscalationDigest[]): WeightedEscalationDigest[] {
    const matched = collections.filter(items, (candidate: WeightedEscalationDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedEscalationDigests(store: WeightedEscalationDigestStore, query: WeightedEscalationDigestQuery): WeightedEscalationDigest[] {
  return query.apply(store.list());
}
