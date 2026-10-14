import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingPathTemplate } from "./rolling-path-template.js";

/** Keeps rolling path templates by code. */
export interface RollingPathTemplateStore {
  find(code: string): RollingPathTemplate | undefined;
  save(item: RollingPathTemplate): void;
  remove(code: string): boolean;
  list(): RollingPathTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingPathTemplateStore implements RollingPathTemplateStore {
  items: Map<string, RollingPathTemplate>;
  order: string[];

  constructor(items: Map<string, RollingPathTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingPathTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingPathTemplate): void {
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

  list(): RollingPathTemplate[] {
    const out: RollingPathTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingPathTemplateStore(): RollingPathTemplateStore {
  return new MemoryRollingPathTemplateStore(new Map<string, RollingPathTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingPathTemplateStore implements RollingPathTemplateStore {
  inner: RollingPathTemplateStore;
  cache: cache.TtlCache<RollingPathTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingPathTemplateStore,
    cacheValue: cache.TtlCache<RollingPathTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingPathTemplate | undefined {
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

  save(item: RollingPathTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingPathTemplate[] {
    return this.inner.list();
  }
}

export function newCachedRollingPathTemplateStore(inner: RollingPathTemplateStore, ttl: number, clockValue: clock.Clock): RollingPathTemplateStore {
  return new CachedRollingPathTemplateStore(inner, cache.newTtlCache<RollingPathTemplate>(512, ttl, clockValue), 0, 0);
}

/** Selects rolling path templates. Empty fields match all. */
export class RollingPathTemplateQuery {
  category: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minRevision: number, statuses: string[], limit: number) {
    this.category = category;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingPathTemplate): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingPathTemplate[]): RollingPathTemplate[] {
    const matched = collections.filter(items, (candidate: RollingPathTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingPathTemplates(store: RollingPathTemplateStore, query: RollingPathTemplateQuery): RollingPathTemplate[] {
  return query.apply(store.list());
}
