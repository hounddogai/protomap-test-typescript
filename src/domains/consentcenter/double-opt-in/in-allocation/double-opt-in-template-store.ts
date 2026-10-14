import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DoubleOptInTemplate } from "./double-opt-in-template.js";

/** Keeps double opt in templates by code. */
export interface DoubleOptInTemplateStore {
  find(code: string): DoubleOptInTemplate | undefined;
  save(item: DoubleOptInTemplate): void;
  remove(code: string): boolean;
  list(): DoubleOptInTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDoubleOptInTemplateStore implements DoubleOptInTemplateStore {
  items: Map<string, DoubleOptInTemplate>;
  order: string[];

  constructor(items: Map<string, DoubleOptInTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DoubleOptInTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DoubleOptInTemplate): void {
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

  list(): DoubleOptInTemplate[] {
    const out: DoubleOptInTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDoubleOptInTemplateStore(): DoubleOptInTemplateStore {
  return new MemoryDoubleOptInTemplateStore(new Map<string, DoubleOptInTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDoubleOptInTemplateStore implements DoubleOptInTemplateStore {
  inner: DoubleOptInTemplateStore;
  cache: cache.TtlCache<DoubleOptInTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: DoubleOptInTemplateStore,
    cacheValue: cache.TtlCache<DoubleOptInTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DoubleOptInTemplate | undefined {
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

  save(item: DoubleOptInTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DoubleOptInTemplate[] {
    return this.inner.list();
  }
}

export function newCachedDoubleOptInTemplateStore(inner: DoubleOptInTemplateStore, ttl: number, clockValue: clock.Clock): DoubleOptInTemplateStore {
  return new CachedDoubleOptInTemplateStore(inner, cache.newTtlCache<DoubleOptInTemplate>(1024, ttl, clockValue), 0, 0);
}

/** Selects double opt in templates. Empty fields match all. */
export class DoubleOptInTemplateQuery {
  title: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minStartsAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DoubleOptInTemplate): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DoubleOptInTemplate[]): DoubleOptInTemplate[] {
    const matched = collections.filter(items, (candidate: DoubleOptInTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDoubleOptInTemplates(store: DoubleOptInTemplateStore, query: DoubleOptInTemplateQuery): DoubleOptInTemplate[] {
  return query.apply(store.list());
}
