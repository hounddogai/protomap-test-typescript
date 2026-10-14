import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SlaProfile } from "./sla-profile.js";

/** Keeps sla profiles by code. */
export interface SlaProfileStore {
  find(code: string): SlaProfile | undefined;
  save(item: SlaProfile): void;
  remove(code: string): boolean;
  list(): SlaProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySlaProfileStore implements SlaProfileStore {
  items: Map<string, SlaProfile>;
  order: string[];

  constructor(items: Map<string, SlaProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SlaProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SlaProfile): void {
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

  list(): SlaProfile[] {
    const out: SlaProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySlaProfileStore(): SlaProfileStore {
  return new MemorySlaProfileStore(new Map<string, SlaProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSlaProfileStore implements SlaProfileStore {
  inner: SlaProfileStore;
  cache: cache.TtlCache<SlaProfile>;
  hits: number;
  misses: number;

  constructor(inner: SlaProfileStore, cacheValue: cache.TtlCache<SlaProfile>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SlaProfile | undefined {
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

  save(item: SlaProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SlaProfile[] {
    return this.inner.list();
  }
}

export function newCachedSlaProfileStore(inner: SlaProfileStore, ttl: number, clockValue: clock.Clock): SlaProfileStore {
  return new CachedSlaProfileStore(inner, cache.newTtlCache<SlaProfile>(128, ttl, clockValue), 0, 0);
}

/** Selects sla profiles. Empty fields match all. */
export class SlaProfileQuery {
  name: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SlaProfile): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SlaProfile[]): SlaProfile[] {
    const matched = collections.filter(items, (candidate: SlaProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSlaProfiles(store: SlaProfileStore, query: SlaProfileQuery): SlaProfile[] {
  return query.apply(store.list());
}
