import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingWarmupTemplate } from "./rolling-warmup-template.js";

/** Keeps rolling warmup templates by code. */
export interface RollingWarmupTemplateStore {
  find(code: string): RollingWarmupTemplate | undefined;
  save(item: RollingWarmupTemplate): void;
  remove(code: string): boolean;
  list(): RollingWarmupTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingWarmupTemplateStore implements RollingWarmupTemplateStore {
  items: Map<string, RollingWarmupTemplate>;
  order: string[];

  constructor(items: Map<string, RollingWarmupTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingWarmupTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingWarmupTemplate): void {
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

  list(): RollingWarmupTemplate[] {
    const out: RollingWarmupTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingWarmupTemplateStore(): RollingWarmupTemplateStore {
  return new MemoryRollingWarmupTemplateStore(new Map<string, RollingWarmupTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingWarmupTemplateStore implements RollingWarmupTemplateStore {
  inner: RollingWarmupTemplateStore;
  cache: cache.TtlCache<RollingWarmupTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingWarmupTemplateStore,
    cacheValue: cache.TtlCache<RollingWarmupTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingWarmupTemplate | undefined {
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

  save(item: RollingWarmupTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingWarmupTemplate[] {
    return this.inner.list();
  }
}

export function newCachedRollingWarmupTemplateStore(inner: RollingWarmupTemplateStore, ttl: number, clockValue: clock.Clock): RollingWarmupTemplateStore {
  return new CachedRollingWarmupTemplateStore(
    inner,
    cache.newTtlCache<RollingWarmupTemplate>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling warmup templates. Empty fields match all. */
export class RollingWarmupTemplateQuery {
  title: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minScore: number, statuses: string[], limit: number) {
    this.title = title;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingWarmupTemplate): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingWarmupTemplate[]): RollingWarmupTemplate[] {
    const matched = collections.filter(items, (candidate: RollingWarmupTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingWarmupTemplates(store: RollingWarmupTemplateStore, query: RollingWarmupTemplateQuery): RollingWarmupTemplate[] {
  return query.apply(store.list());
}
