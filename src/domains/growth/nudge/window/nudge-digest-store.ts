import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { NudgeDigest } from "./nudge-digest.js";

/** Keeps nudge digests by code. */
export interface NudgeDigestStore {
  find(code: string): NudgeDigest | undefined;
  save(item: NudgeDigest): void;
  remove(code: string): boolean;
  list(): NudgeDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryNudgeDigestStore implements NudgeDigestStore {
  items: Map<string, NudgeDigest>;
  order: string[];

  constructor(items: Map<string, NudgeDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): NudgeDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: NudgeDigest): void {
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

  list(): NudgeDigest[] {
    const out: NudgeDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryNudgeDigestStore(): NudgeDigestStore {
  return new MemoryNudgeDigestStore(new Map<string, NudgeDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedNudgeDigestStore implements NudgeDigestStore {
  inner: NudgeDigestStore;
  cache: cache.TtlCache<NudgeDigest>;
  hits: number;
  misses: number;

  constructor(inner: NudgeDigestStore, cacheValue: cache.TtlCache<NudgeDigest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): NudgeDigest | undefined {
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

  save(item: NudgeDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): NudgeDigest[] {
    return this.inner.list();
  }
}

export function newCachedNudgeDigestStore(inner: NudgeDigestStore, ttl: number, clockValue: clock.Clock): NudgeDigestStore {
  return new CachedNudgeDigestStore(inner, cache.newTtlCache<NudgeDigest>(512, ttl, clockValue), 0, 0);
}

/** Selects nudge digests. Empty fields match all. */
export class NudgeDigestQuery {
  unit: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minRetries: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: NudgeDigest): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: NudgeDigest[]): NudgeDigest[] {
    const matched = collections.filter(items, (candidate: NudgeDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findNudgeDigests(store: NudgeDigestStore, query: NudgeDigestQuery): NudgeDigest[] {
  return query.apply(store.list());
}
