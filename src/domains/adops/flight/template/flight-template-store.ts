import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FlightTemplate } from "./flight-template.js";

/** Keeps flight templates by code. */
export interface FlightTemplateStore {
  find(code: string): FlightTemplate | undefined;
  save(item: FlightTemplate): void;
  remove(code: string): boolean;
  list(): FlightTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFlightTemplateStore implements FlightTemplateStore {
  items: Map<string, FlightTemplate>;
  order: string[];

  constructor(items: Map<string, FlightTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FlightTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FlightTemplate): void {
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

  list(): FlightTemplate[] {
    const out: FlightTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFlightTemplateStore(): FlightTemplateStore {
  return new MemoryFlightTemplateStore(new Map<string, FlightTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFlightTemplateStore implements FlightTemplateStore {
  inner: FlightTemplateStore;
  cache: cache.TtlCache<FlightTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: FlightTemplateStore,
    cacheValue: cache.TtlCache<FlightTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FlightTemplate | undefined {
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

  save(item: FlightTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FlightTemplate[] {
    return this.inner.list();
  }
}

export function newCachedFlightTemplateStore(inner: FlightTemplateStore, ttl: number, clockValue: clock.Clock): FlightTemplateStore {
  return new CachedFlightTemplateStore(inner, cache.newTtlCache<FlightTemplate>(256, ttl, clockValue), 0, 0);
}

/** Selects flight templates. Empty fields match all. */
export class FlightTemplateQuery {
  channel: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minFloorValue: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FlightTemplate): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FlightTemplate[]): FlightTemplate[] {
    const matched = collections.filter(items, (candidate: FlightTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFlightTemplates(store: FlightTemplateStore, query: FlightTemplateQuery): FlightTemplate[] {
  return query.apply(store.list());
}
