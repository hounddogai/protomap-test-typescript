import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalExitRuleDigest } from "./global-exit-rule-digest.js";

/** Keeps global exit rule digests by code. */
export interface GlobalExitRuleDigestStore {
  find(code: string): GlobalExitRuleDigest | undefined;
  save(item: GlobalExitRuleDigest): void;
  remove(code: string): boolean;
  list(): GlobalExitRuleDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalExitRuleDigestStore implements GlobalExitRuleDigestStore {
  items: Map<string, GlobalExitRuleDigest>;
  order: string[];

  constructor(items: Map<string, GlobalExitRuleDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalExitRuleDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalExitRuleDigest): void {
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

  list(): GlobalExitRuleDigest[] {
    const out: GlobalExitRuleDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalExitRuleDigestStore(): GlobalExitRuleDigestStore {
  return new MemoryGlobalExitRuleDigestStore(new Map<string, GlobalExitRuleDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalExitRuleDigestStore implements GlobalExitRuleDigestStore {
  inner: GlobalExitRuleDigestStore;
  cache: cache.TtlCache<GlobalExitRuleDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalExitRuleDigestStore,
    cacheValue: cache.TtlCache<GlobalExitRuleDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalExitRuleDigest | undefined {
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

  save(item: GlobalExitRuleDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalExitRuleDigest[] {
    return this.inner.list();
  }
}

export function newCachedGlobalExitRuleDigestStore(inner: GlobalExitRuleDigestStore, ttl: number, clockValue: clock.Clock): GlobalExitRuleDigestStore {
  return new CachedGlobalExitRuleDigestStore(
    inner,
    cache.newTtlCache<GlobalExitRuleDigest>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global exit rule digests. Empty fields match all. */
export class GlobalExitRuleDigestQuery {
  locale: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minGraceDays: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalExitRuleDigest): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalExitRuleDigest[]): GlobalExitRuleDigest[] {
    const matched = collections.filter(items, (candidate: GlobalExitRuleDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalExitRuleDigests(store: GlobalExitRuleDigestStore, query: GlobalExitRuleDigestQuery): GlobalExitRuleDigest[] {
  return query.apply(store.list());
}
