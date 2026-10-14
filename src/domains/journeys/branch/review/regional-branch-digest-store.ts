import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalBranchDigest } from "./regional-branch-digest.js";

/** Keeps regional branch digests by code. */
export interface RegionalBranchDigestStore {
  find(code: string): RegionalBranchDigest | undefined;
  save(item: RegionalBranchDigest): void;
  remove(code: string): boolean;
  list(): RegionalBranchDigest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalBranchDigestStore implements RegionalBranchDigestStore {
  items: Map<string, RegionalBranchDigest>;
  order: string[];

  constructor(items: Map<string, RegionalBranchDigest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalBranchDigest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalBranchDigest): void {
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

  list(): RegionalBranchDigest[] {
    const out: RegionalBranchDigest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalBranchDigestStore(): RegionalBranchDigestStore {
  return new MemoryRegionalBranchDigestStore(new Map<string, RegionalBranchDigest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalBranchDigestStore implements RegionalBranchDigestStore {
  inner: RegionalBranchDigestStore;
  cache: cache.TtlCache<RegionalBranchDigest>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalBranchDigestStore,
    cacheValue: cache.TtlCache<RegionalBranchDigest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalBranchDigest | undefined {
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

  save(item: RegionalBranchDigest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalBranchDigest[] {
    return this.inner.list();
  }
}

export function newCachedRegionalBranchDigestStore(inner: RegionalBranchDigestStore, ttl: number, clockValue: clock.Clock): RegionalBranchDigestStore {
  return new CachedRegionalBranchDigestStore(
    inner,
    cache.newTtlCache<RegionalBranchDigest>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional branch digests. Empty fields match all. */
export class RegionalBranchDigestQuery {
  channel: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minMaximum: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalBranchDigest): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalBranchDigest[]): RegionalBranchDigest[] {
    const matched = collections.filter(items, (candidate: RegionalBranchDigest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalBranchDigests(store: RegionalBranchDigestStore, query: RegionalBranchDigestQuery): RegionalBranchDigest[] {
  return query.apply(store.list());
}
