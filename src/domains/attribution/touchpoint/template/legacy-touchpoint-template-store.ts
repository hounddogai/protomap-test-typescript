import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyTouchpointTemplate } from "./legacy-touchpoint-template.js";

/** Keeps legacy touchpoint templates by code. */
export interface LegacyTouchpointTemplateStore {
  find(code: string): LegacyTouchpointTemplate | undefined;
  save(item: LegacyTouchpointTemplate): void;
  remove(code: string): boolean;
  list(): LegacyTouchpointTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyTouchpointTemplateStore implements LegacyTouchpointTemplateStore {
  items: Map<string, LegacyTouchpointTemplate>;
  order: string[];

  constructor(items: Map<string, LegacyTouchpointTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyTouchpointTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyTouchpointTemplate): void {
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

  list(): LegacyTouchpointTemplate[] {
    const out: LegacyTouchpointTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyTouchpointTemplateStore(): LegacyTouchpointTemplateStore {
  return new MemoryLegacyTouchpointTemplateStore(new Map<string, LegacyTouchpointTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyTouchpointTemplateStore implements LegacyTouchpointTemplateStore {
  inner: LegacyTouchpointTemplateStore;
  cache: cache.TtlCache<LegacyTouchpointTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyTouchpointTemplateStore,
    cacheValue: cache.TtlCache<LegacyTouchpointTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyTouchpointTemplate | undefined {
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

  save(item: LegacyTouchpointTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyTouchpointTemplate[] {
    return this.inner.list();
  }
}

export function newCachedLegacyTouchpointTemplateStore(inner: LegacyTouchpointTemplateStore, ttl: number, clockValue: clock.Clock): LegacyTouchpointTemplateStore {
  return new CachedLegacyTouchpointTemplateStore(
    inner,
    cache.newTtlCache<LegacyTouchpointTemplate>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy touchpoint templates. Empty fields match all. */
export class LegacyTouchpointTemplateQuery {
  category: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.category = category;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyTouchpointTemplate): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyTouchpointTemplate[]): LegacyTouchpointTemplate[] {
    const matched = collections.filter(items, (candidate: LegacyTouchpointTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyTouchpointTemplates(store: LegacyTouchpointTemplateStore, query: LegacyTouchpointTemplateQuery): LegacyTouchpointTemplate[] {
  return query.apply(store.list());
}
