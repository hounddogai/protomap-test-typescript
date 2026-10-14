import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LevelTemplate } from "./level-template.js";

/** Keeps level templates by code. */
export interface LevelTemplateStore {
  find(code: string): LevelTemplate | undefined;
  save(item: LevelTemplate): void;
  remove(code: string): boolean;
  list(): LevelTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLevelTemplateStore implements LevelTemplateStore {
  items: Map<string, LevelTemplate>;
  order: string[];

  constructor(items: Map<string, LevelTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LevelTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LevelTemplate): void {
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

  list(): LevelTemplate[] {
    const out: LevelTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLevelTemplateStore(): LevelTemplateStore {
  return new MemoryLevelTemplateStore(new Map<string, LevelTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLevelTemplateStore implements LevelTemplateStore {
  inner: LevelTemplateStore;
  cache: cache.TtlCache<LevelTemplate>;
  hits: number;
  misses: number;

  constructor(inner: LevelTemplateStore, cacheValue: cache.TtlCache<LevelTemplate>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LevelTemplate | undefined {
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

  save(item: LevelTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LevelTemplate[] {
    return this.inner.list();
  }
}

export function newCachedLevelTemplateStore(inner: LevelTemplateStore, ttl: number, clockValue: clock.Clock): LevelTemplateStore {
  return new CachedLevelTemplateStore(inner, cache.newTtlCache<LevelTemplate>(1024, ttl, clockValue), 0, 0);
}

/** Selects level templates. Empty fields match all. */
export class LevelTemplateQuery {
  name: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minMinimum: number, statuses: string[], limit: number) {
    this.name = name;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LevelTemplate): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LevelTemplate[]): LevelTemplate[] {
    const matched = collections.filter(items, (candidate: LevelTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLevelTemplates(store: LevelTemplateStore, query: LevelTemplateQuery): LevelTemplate[] {
  return query.apply(store.list());
}
