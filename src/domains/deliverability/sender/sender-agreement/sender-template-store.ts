import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SenderTemplate } from "./sender-template.js";

/** Keeps sender templates by code. */
export interface SenderTemplateStore {
  find(code: string): SenderTemplate | undefined;
  save(item: SenderTemplate): void;
  remove(code: string): boolean;
  list(): SenderTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySenderTemplateStore implements SenderTemplateStore {
  items: Map<string, SenderTemplate>;
  order: string[];

  constructor(items: Map<string, SenderTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SenderTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SenderTemplate): void {
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

  list(): SenderTemplate[] {
    const out: SenderTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySenderTemplateStore(): SenderTemplateStore {
  return new MemorySenderTemplateStore(new Map<string, SenderTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSenderTemplateStore implements SenderTemplateStore {
  inner: SenderTemplateStore;
  cache: cache.TtlCache<SenderTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: SenderTemplateStore,
    cacheValue: cache.TtlCache<SenderTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SenderTemplate | undefined {
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

  save(item: SenderTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SenderTemplate[] {
    return this.inner.list();
  }
}

export function newCachedSenderTemplateStore(inner: SenderTemplateStore, ttl: number, clockValue: clock.Clock): SenderTemplateStore {
  return new CachedSenderTemplateStore(inner, cache.newTtlCache<SenderTemplate>(512, ttl, clockValue), 0, 0);
}

/** Selects sender templates. Empty fields match all. */
export class SenderTemplateQuery {
  segment: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minCost: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SenderTemplate): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SenderTemplate[]): SenderTemplate[] {
    const matched = collections.filter(items, (candidate: SenderTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSenderTemplates(store: SenderTemplateStore, query: SenderTemplateQuery): SenderTemplate[] {
  return query.apply(store.list());
}
