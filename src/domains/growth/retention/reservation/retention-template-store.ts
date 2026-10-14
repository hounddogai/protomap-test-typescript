import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RetentionTemplate } from "./retention-template.js";

/** Keeps retention templates by code. */
export interface RetentionTemplateStore {
  find(code: string): RetentionTemplate | undefined;
  save(item: RetentionTemplate): void;
  remove(code: string): boolean;
  list(): RetentionTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRetentionTemplateStore implements RetentionTemplateStore {
  items: Map<string, RetentionTemplate>;
  order: string[];

  constructor(items: Map<string, RetentionTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RetentionTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RetentionTemplate): void {
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

  list(): RetentionTemplate[] {
    const out: RetentionTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRetentionTemplateStore(): RetentionTemplateStore {
  return new MemoryRetentionTemplateStore(new Map<string, RetentionTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRetentionTemplateStore implements RetentionTemplateStore {
  inner: RetentionTemplateStore;
  cache: cache.TtlCache<RetentionTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: RetentionTemplateStore,
    cacheValue: cache.TtlCache<RetentionTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RetentionTemplate | undefined {
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

  save(item: RetentionTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RetentionTemplate[] {
    return this.inner.list();
  }
}

export function newCachedRetentionTemplateStore(inner: RetentionTemplateStore, ttl: number, clockValue: clock.Clock): RetentionTemplateStore {
  return new CachedRetentionTemplateStore(inner, cache.newTtlCache<RetentionTemplate>(1024, ttl, clockValue), 0, 0);
}

/** Selects retention templates. Empty fields match all. */
export class RetentionTemplateQuery {
  category: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minPriority: number, statuses: string[], limit: number) {
    this.category = category;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RetentionTemplate): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RetentionTemplate[]): RetentionTemplate[] {
    const matched = collections.filter(items, (candidate: RetentionTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRetentionTemplates(store: RetentionTemplateStore, query: RetentionTemplateQuery): RetentionTemplate[] {
  return query.apply(store.list());
}
