import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultBadgeTier } from "./default-badge-tier.js";

/** Keeps default badge tiers by code. */
export interface DefaultBadgeTierStore {
  find(code: string): DefaultBadgeTier | undefined;
  save(item: DefaultBadgeTier): void;
  remove(code: string): boolean;
  list(): DefaultBadgeTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultBadgeTierStore implements DefaultBadgeTierStore {
  items: Map<string, DefaultBadgeTier>;
  order: string[];

  constructor(items: Map<string, DefaultBadgeTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultBadgeTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultBadgeTier): void {
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

  list(): DefaultBadgeTier[] {
    const out: DefaultBadgeTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultBadgeTierStore(): DefaultBadgeTierStore {
  return new MemoryDefaultBadgeTierStore(new Map<string, DefaultBadgeTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultBadgeTierStore implements DefaultBadgeTierStore {
  inner: DefaultBadgeTierStore;
  cache: cache.TtlCache<DefaultBadgeTier>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultBadgeTierStore,
    cacheValue: cache.TtlCache<DefaultBadgeTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultBadgeTier | undefined {
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

  save(item: DefaultBadgeTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultBadgeTier[] {
    return this.inner.list();
  }
}

export function newCachedDefaultBadgeTierStore(inner: DefaultBadgeTierStore, ttl: number, clockValue: clock.Clock): DefaultBadgeTierStore {
  return new CachedDefaultBadgeTierStore(inner, cache.newTtlCache<DefaultBadgeTier>(1024, ttl, clockValue), 0, 0);
}

/** Selects default badge tiers. Empty fields match all. */
export class DefaultBadgeTierQuery {
  channel: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRevision: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultBadgeTier): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultBadgeTier[]): DefaultBadgeTier[] {
    const matched = collections.filter(items, (candidate: DefaultBadgeTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultBadgeTiers(store: DefaultBadgeTierStore, query: DefaultBadgeTierQuery): DefaultBadgeTier[] {
  return query.apply(store.list());
}
