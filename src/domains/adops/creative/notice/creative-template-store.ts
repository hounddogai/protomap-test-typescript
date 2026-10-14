import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreativeTemplate } from "./creative-template.js";

/** Keeps creative templates by code. */
export interface CreativeTemplateStore {
  find(code: string): CreativeTemplate | undefined;
  save(item: CreativeTemplate): void;
  remove(code: string): boolean;
  list(): CreativeTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreativeTemplateStore implements CreativeTemplateStore {
  items: Map<string, CreativeTemplate>;
  order: string[];

  constructor(items: Map<string, CreativeTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreativeTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreativeTemplate): void {
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

  list(): CreativeTemplate[] {
    const out: CreativeTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreativeTemplateStore(): CreativeTemplateStore {
  return new MemoryCreativeTemplateStore(new Map<string, CreativeTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreativeTemplateStore implements CreativeTemplateStore {
  inner: CreativeTemplateStore;
  cache: cache.TtlCache<CreativeTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: CreativeTemplateStore,
    cacheValue: cache.TtlCache<CreativeTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreativeTemplate | undefined {
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

  save(item: CreativeTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreativeTemplate[] {
    return this.inner.list();
  }
}

export function newCachedCreativeTemplateStore(inner: CreativeTemplateStore, ttl: number, clockValue: clock.Clock): CreativeTemplateStore {
  return new CachedCreativeTemplateStore(inner, cache.newTtlCache<CreativeTemplate>(256, ttl, clockValue), 0, 0);
}

/** Selects creative templates. Empty fields match all. */
export class CreativeTemplateQuery {
  name: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minGraceDays: number, statuses: string[], limit: number) {
    this.name = name;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreativeTemplate): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreativeTemplate[]): CreativeTemplate[] {
    const matched = collections.filter(items, (candidate: CreativeTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreativeTemplates(store: CreativeTemplateStore, query: CreativeTemplateQuery): CreativeTemplate[] {
  return query.apply(store.list());
}
