import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { JourneyTemplate } from "./journey-template.js";

/** Keeps journey templates by code. */
export interface JourneyTemplateStore {
  find(code: string): JourneyTemplate | undefined;
  save(item: JourneyTemplate): void;
  remove(code: string): boolean;
  list(): JourneyTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryJourneyTemplateStore implements JourneyTemplateStore {
  items: Map<string, JourneyTemplate>;
  order: string[];

  constructor(items: Map<string, JourneyTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): JourneyTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: JourneyTemplate): void {
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

  list(): JourneyTemplate[] {
    const out: JourneyTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryJourneyTemplateStore(): JourneyTemplateStore {
  return new MemoryJourneyTemplateStore(new Map<string, JourneyTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedJourneyTemplateStore implements JourneyTemplateStore {
  inner: JourneyTemplateStore;
  cache: cache.TtlCache<JourneyTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: JourneyTemplateStore,
    cacheValue: cache.TtlCache<JourneyTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): JourneyTemplate | undefined {
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

  save(item: JourneyTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): JourneyTemplate[] {
    return this.inner.list();
  }
}

export function newCachedJourneyTemplateStore(inner: JourneyTemplateStore, ttl: number, clockValue: clock.Clock): JourneyTemplateStore {
  return new CachedJourneyTemplateStore(inner, cache.newTtlCache<JourneyTemplate>(64, ttl, clockValue), 0, 0);
}

/** Selects journey templates. Empty fields match all. */
export class JourneyTemplateQuery {
  title: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCost: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: JourneyTemplate): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: JourneyTemplate[]): JourneyTemplate[] {
    const matched = collections.filter(items, (candidate: JourneyTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findJourneyTemplates(store: JourneyTemplateStore, query: JourneyTemplateQuery): JourneyTemplate[] {
  return query.apply(store.list());
}
