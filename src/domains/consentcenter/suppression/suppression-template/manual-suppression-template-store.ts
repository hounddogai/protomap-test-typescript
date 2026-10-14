import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualSuppressionTemplate } from "./manual-suppression-template.js";

/** Keeps manual suppression templates by code. */
export interface ManualSuppressionTemplateStore {
  find(code: string): ManualSuppressionTemplate | undefined;
  save(item: ManualSuppressionTemplate): void;
  remove(code: string): boolean;
  list(): ManualSuppressionTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualSuppressionTemplateStore implements ManualSuppressionTemplateStore {
  items: Map<string, ManualSuppressionTemplate>;
  order: string[];

  constructor(items: Map<string, ManualSuppressionTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualSuppressionTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualSuppressionTemplate): void {
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

  list(): ManualSuppressionTemplate[] {
    const out: ManualSuppressionTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualSuppressionTemplateStore(): ManualSuppressionTemplateStore {
  return new MemoryManualSuppressionTemplateStore(new Map<string, ManualSuppressionTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualSuppressionTemplateStore implements ManualSuppressionTemplateStore {
  inner: ManualSuppressionTemplateStore;
  cache: cache.TtlCache<ManualSuppressionTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualSuppressionTemplateStore,
    cacheValue: cache.TtlCache<ManualSuppressionTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualSuppressionTemplate | undefined {
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

  save(item: ManualSuppressionTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualSuppressionTemplate[] {
    return this.inner.list();
  }
}

export function newCachedManualSuppressionTemplateStore(inner: ManualSuppressionTemplateStore, ttl: number, clockValue: clock.Clock): ManualSuppressionTemplateStore {
  return new CachedManualSuppressionTemplateStore(
    inner,
    cache.newTtlCache<ManualSuppressionTemplate>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual suppression templates. Empty fields match all. */
export class ManualSuppressionTemplateQuery {
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

  matches(item: ManualSuppressionTemplate): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualSuppressionTemplate[]): ManualSuppressionTemplate[] {
    const matched = collections.filter(items, (candidate: ManualSuppressionTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualSuppressionTemplates(store: ManualSuppressionTemplateStore, query: ManualSuppressionTemplateQuery): ManualSuppressionTemplate[] {
  return query.apply(store.list());
}
