import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PathTemplate } from "./path-template.js";

/** Keeps path templates by code. */
export interface PathTemplateStore {
  find(code: string): PathTemplate | undefined;
  save(item: PathTemplate): void;
  remove(code: string): boolean;
  list(): PathTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPathTemplateStore implements PathTemplateStore {
  items: Map<string, PathTemplate>;
  order: string[];

  constructor(items: Map<string, PathTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PathTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PathTemplate): void {
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

  list(): PathTemplate[] {
    const out: PathTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPathTemplateStore(): PathTemplateStore {
  return new MemoryPathTemplateStore(new Map<string, PathTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPathTemplateStore implements PathTemplateStore {
  inner: PathTemplateStore;
  cache: cache.TtlCache<PathTemplate>;
  hits: number;
  misses: number;

  constructor(inner: PathTemplateStore, cacheValue: cache.TtlCache<PathTemplate>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PathTemplate | undefined {
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

  save(item: PathTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PathTemplate[] {
    return this.inner.list();
  }
}

export function newCachedPathTemplateStore(inner: PathTemplateStore, ttl: number, clockValue: clock.Clock): PathTemplateStore {
  return new CachedPathTemplateStore(inner, cache.newTtlCache<PathTemplate>(256, ttl, clockValue), 0, 0);
}

/** Selects path templates. Empty fields match all. */
export class PathTemplateQuery {
  name: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minClicks: number, statuses: string[], limit: number) {
    this.name = name;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PathTemplate): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PathTemplate[]): PathTemplate[] {
    const matched = collections.filter(items, (candidate: PathTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPathTemplates(store: PathTemplateStore, query: PathTemplateQuery): PathTemplate[] {
  return query.apply(store.list());
}
