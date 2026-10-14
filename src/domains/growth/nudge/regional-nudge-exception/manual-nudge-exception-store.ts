import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualNudgeException } from "./manual-nudge-exception.js";

/** Keeps manual nudge exceptions by code. */
export interface ManualNudgeExceptionStore {
  find(code: string): ManualNudgeException | undefined;
  save(item: ManualNudgeException): void;
  remove(code: string): boolean;
  list(): ManualNudgeException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualNudgeExceptionStore implements ManualNudgeExceptionStore {
  items: Map<string, ManualNudgeException>;
  order: string[];

  constructor(items: Map<string, ManualNudgeException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualNudgeException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualNudgeException): void {
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

  list(): ManualNudgeException[] {
    const out: ManualNudgeException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualNudgeExceptionStore(): ManualNudgeExceptionStore {
  return new MemoryManualNudgeExceptionStore(new Map<string, ManualNudgeException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualNudgeExceptionStore implements ManualNudgeExceptionStore {
  inner: ManualNudgeExceptionStore;
  cache: cache.TtlCache<ManualNudgeException>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualNudgeExceptionStore,
    cacheValue: cache.TtlCache<ManualNudgeException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualNudgeException | undefined {
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

  save(item: ManualNudgeException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualNudgeException[] {
    return this.inner.list();
  }
}

export function newCachedManualNudgeExceptionStore(inner: ManualNudgeExceptionStore, ttl: number, clockValue: clock.Clock): ManualNudgeExceptionStore {
  return new CachedManualNudgeExceptionStore(
    inner,
    cache.newTtlCache<ManualNudgeException>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual nudge exceptions. Empty fields match all. */
export class ManualNudgeExceptionQuery {
  name: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBatchSize: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualNudgeException): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualNudgeException[]): ManualNudgeException[] {
    const matched = collections.filter(items, (candidate: ManualNudgeException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualNudgeExceptions(store: ManualNudgeExceptionStore, query: ManualNudgeExceptionQuery): ManualNudgeException[] {
  return query.apply(store.list());
}
