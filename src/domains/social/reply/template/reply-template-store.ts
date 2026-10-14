import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReplyTemplate } from "./reply-template.js";

/** Keeps reply templates by code. */
export interface ReplyTemplateStore {
  find(code: string): ReplyTemplate | undefined;
  save(item: ReplyTemplate): void;
  remove(code: string): boolean;
  list(): ReplyTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReplyTemplateStore implements ReplyTemplateStore {
  items: Map<string, ReplyTemplate>;
  order: string[];

  constructor(items: Map<string, ReplyTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReplyTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReplyTemplate): void {
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

  list(): ReplyTemplate[] {
    const out: ReplyTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReplyTemplateStore(): ReplyTemplateStore {
  return new MemoryReplyTemplateStore(new Map<string, ReplyTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReplyTemplateStore implements ReplyTemplateStore {
  inner: ReplyTemplateStore;
  cache: cache.TtlCache<ReplyTemplate>;
  hits: number;
  misses: number;

  constructor(inner: ReplyTemplateStore, cacheValue: cache.TtlCache<ReplyTemplate>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReplyTemplate | undefined {
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

  save(item: ReplyTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReplyTemplate[] {
    return this.inner.list();
  }
}

export function newCachedReplyTemplateStore(inner: ReplyTemplateStore, ttl: number, clockValue: clock.Clock): ReplyTemplateStore {
  return new CachedReplyTemplateStore(inner, cache.newTtlCache<ReplyTemplate>(64, ttl, clockValue), 0, 0);
}

/** Selects reply templates. Empty fields match all. */
export class ReplyTemplateQuery {
  source: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minConversionRate: number, statuses: string[], limit: number) {
    this.source = source;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReplyTemplate): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReplyTemplate[]): ReplyTemplate[] {
    const matched = collections.filter(items, (candidate: ReplyTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReplyTemplates(store: ReplyTemplateStore, query: ReplyTemplateQuery): ReplyTemplate[] {
  return query.apply(store.list());
}
