import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultBadgeGroup } from "./default-badge-group.js";

/** Keeps default badge groups by code. */
export interface DefaultBadgeGroupStore {
  find(code: string): DefaultBadgeGroup | undefined;
  save(item: DefaultBadgeGroup): void;
  remove(code: string): boolean;
  list(): DefaultBadgeGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultBadgeGroupStore implements DefaultBadgeGroupStore {
  items: Map<string, DefaultBadgeGroup>;
  order: string[];

  constructor(items: Map<string, DefaultBadgeGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultBadgeGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultBadgeGroup): void {
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

  list(): DefaultBadgeGroup[] {
    const out: DefaultBadgeGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultBadgeGroupStore(): DefaultBadgeGroupStore {
  return new MemoryDefaultBadgeGroupStore(new Map<string, DefaultBadgeGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultBadgeGroupStore implements DefaultBadgeGroupStore {
  inner: DefaultBadgeGroupStore;
  cache: cache.TtlCache<DefaultBadgeGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultBadgeGroupStore,
    cacheValue: cache.TtlCache<DefaultBadgeGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultBadgeGroup | undefined {
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

  save(item: DefaultBadgeGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultBadgeGroup[] {
    return this.inner.list();
  }
}

export function newCachedDefaultBadgeGroupStore(inner: DefaultBadgeGroupStore, ttl: number, clockValue: clock.Clock): DefaultBadgeGroupStore {
  return new CachedDefaultBadgeGroupStore(inner, cache.newTtlCache<DefaultBadgeGroup>(512, ttl, clockValue), 0, 0);
}

/** Selects default badge groups. Empty fields match all. */
export class DefaultBadgeGroupQuery {
  label: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultBadgeGroup): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultBadgeGroup[]): DefaultBadgeGroup[] {
    const matched = collections.filter(items, (candidate: DefaultBadgeGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultBadgeGroups(store: DefaultBadgeGroupStore, query: DefaultBadgeGroupQuery): DefaultBadgeGroup[] {
  return query.apply(store.list());
}
