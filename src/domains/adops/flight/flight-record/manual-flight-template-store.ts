import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualFlightTemplate } from "./manual-flight-template.js";

/** Keeps manual flight templates by code. */
export interface ManualFlightTemplateStore {
  find(code: string): ManualFlightTemplate | undefined;
  save(item: ManualFlightTemplate): void;
  remove(code: string): boolean;
  list(): ManualFlightTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualFlightTemplateStore implements ManualFlightTemplateStore {
  items: Map<string, ManualFlightTemplate>;
  order: string[];

  constructor(items: Map<string, ManualFlightTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualFlightTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualFlightTemplate): void {
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

  list(): ManualFlightTemplate[] {
    const out: ManualFlightTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualFlightTemplateStore(): ManualFlightTemplateStore {
  return new MemoryManualFlightTemplateStore(new Map<string, ManualFlightTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualFlightTemplateStore implements ManualFlightTemplateStore {
  inner: ManualFlightTemplateStore;
  cache: cache.TtlCache<ManualFlightTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualFlightTemplateStore,
    cacheValue: cache.TtlCache<ManualFlightTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualFlightTemplate | undefined {
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

  save(item: ManualFlightTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualFlightTemplate[] {
    return this.inner.list();
  }
}

export function newCachedManualFlightTemplateStore(inner: ManualFlightTemplateStore, ttl: number, clockValue: clock.Clock): ManualFlightTemplateStore {
  return new CachedManualFlightTemplateStore(
    inner,
    cache.newTtlCache<ManualFlightTemplate>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual flight templates. Empty fields match all. */
export class ManualFlightTemplateQuery {
  channel: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCost: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualFlightTemplate): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualFlightTemplate[]): ManualFlightTemplate[] {
    const matched = collections.filter(items, (candidate: ManualFlightTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualFlightTemplates(store: ManualFlightTemplateStore, query: ManualFlightTemplateQuery): ManualFlightTemplate[] {
  return query.apply(store.list());
}
