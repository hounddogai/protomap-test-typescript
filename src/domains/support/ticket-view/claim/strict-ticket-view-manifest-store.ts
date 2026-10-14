import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictTicketViewManifest } from "./strict-ticket-view-manifest.js";

/** Keeps strict ticket view manifests by code. */
export interface StrictTicketViewManifestStore {
  find(code: string): StrictTicketViewManifest | undefined;
  save(item: StrictTicketViewManifest): void;
  remove(code: string): boolean;
  list(): StrictTicketViewManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictTicketViewManifestStore implements StrictTicketViewManifestStore {
  items: Map<string, StrictTicketViewManifest>;
  order: string[];

  constructor(items: Map<string, StrictTicketViewManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictTicketViewManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictTicketViewManifest): void {
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

  list(): StrictTicketViewManifest[] {
    const out: StrictTicketViewManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictTicketViewManifestStore(): StrictTicketViewManifestStore {
  return new MemoryStrictTicketViewManifestStore(new Map<string, StrictTicketViewManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictTicketViewManifestStore implements StrictTicketViewManifestStore {
  inner: StrictTicketViewManifestStore;
  cache: cache.TtlCache<StrictTicketViewManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictTicketViewManifestStore,
    cacheValue: cache.TtlCache<StrictTicketViewManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictTicketViewManifest | undefined {
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

  save(item: StrictTicketViewManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictTicketViewManifest[] {
    return this.inner.list();
  }
}

export function newCachedStrictTicketViewManifestStore(inner: StrictTicketViewManifestStore, ttl: number, clockValue: clock.Clock): StrictTicketViewManifestStore {
  return new CachedStrictTicketViewManifestStore(
    inner,
    cache.newTtlCache<StrictTicketViewManifest>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict ticket view manifests. Empty fields match all. */
export class StrictTicketViewManifestQuery {
  title: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minAmount: number, statuses: string[], limit: number) {
    this.title = title;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictTicketViewManifest): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictTicketViewManifest[]): StrictTicketViewManifest[] {
    const matched = collections.filter(items, (candidate: StrictTicketViewManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictTicketViewManifests(store: StrictTicketViewManifestStore, query: StrictTicketViewManifestQuery): StrictTicketViewManifest[] {
  return query.apply(store.list());
}
