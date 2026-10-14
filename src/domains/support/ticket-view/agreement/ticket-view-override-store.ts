import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TicketViewOverride } from "./ticket-view-override.js";

/** Keeps ticket view overrides by code. */
export interface TicketViewOverrideStore {
  find(code: string): TicketViewOverride | undefined;
  save(item: TicketViewOverride): void;
  remove(code: string): boolean;
  list(): TicketViewOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTicketViewOverrideStore implements TicketViewOverrideStore {
  items: Map<string, TicketViewOverride>;
  order: string[];

  constructor(items: Map<string, TicketViewOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TicketViewOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TicketViewOverride): void {
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

  list(): TicketViewOverride[] {
    const out: TicketViewOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTicketViewOverrideStore(): TicketViewOverrideStore {
  return new MemoryTicketViewOverrideStore(new Map<string, TicketViewOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTicketViewOverrideStore implements TicketViewOverrideStore {
  inner: TicketViewOverrideStore;
  cache: cache.TtlCache<TicketViewOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: TicketViewOverrideStore,
    cacheValue: cache.TtlCache<TicketViewOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TicketViewOverride | undefined {
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

  save(item: TicketViewOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TicketViewOverride[] {
    return this.inner.list();
  }
}

export function newCachedTicketViewOverrideStore(inner: TicketViewOverrideStore, ttl: number, clockValue: clock.Clock): TicketViewOverrideStore {
  return new CachedTicketViewOverrideStore(inner, cache.newTtlCache<TicketViewOverride>(128, ttl, clockValue), 0, 0);
}

/** Selects ticket view overrides. Empty fields match all. */
export class TicketViewOverrideQuery {
  title: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRevision: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TicketViewOverride): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TicketViewOverride[]): TicketViewOverride[] {
    const matched = collections.filter(items, (candidate: TicketViewOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTicketViewOverrides(store: TicketViewOverrideStore, query: TicketViewOverrideQuery): TicketViewOverride[] {
  return query.apply(store.list());
}
