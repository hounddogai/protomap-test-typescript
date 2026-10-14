import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StepDigest } from "./step-digest.js";

/** Keeps step digests by code. */
export interface StepDigestStore {
  find(code: string): StepDigest | undefined;
  save(item: StepDigest): void;
  remove(code: string): boolean;
  list(): StepDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStepDigestStore implements StepDigestStore {
  items: Map<string, StepDigest>;
  order: string[];

  constructor(items: Map<string, StepDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StepDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StepDigest): void {
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

  list(): StepDigest[] {
    const out: StepDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStepDigestStore(): StepDigestStore {
  return new MemoryStepDigestStore(new Map<string, StepDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStepDigestStore implements StepDigestStore {
  inner: StepDigestStore;
  cache: cache.TtlCache<StepDigest>;
  hits: number;
  misses: number;

  constructor(inner: StepDigestStore, cacheValue: cache.TtlCache<StepDigest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StepDigest | undefined {
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

  save(item: StepDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StepDigest[] {
    return this.inner.list();
  }
}

export function newCachedStepDigestStore(inner: StepDigestStore, ttl: number, clockValue: clock.Clock): StepDigestStore {
  return new CachedStepDigestStore(inner, cache.newTtlCache<StepDigest>(256, ttl, clockValue), 0, 0);
}

/** Selects step digests. Empty fields match all. */
export class StepDigestQuery {
  label: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minClicks: number, statuses: string[], limit: number) {
    this.label = label;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StepDigest): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StepDigest[]): StepDigest[] {
    const matched = collections.filter(items, (candidate: StepDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStepDigests(store: StepDigestStore, query: StepDigestQuery): StepDigest[] {
  return query.apply(store.list());
}
