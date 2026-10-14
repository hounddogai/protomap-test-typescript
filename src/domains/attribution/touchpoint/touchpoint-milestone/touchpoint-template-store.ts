import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TouchpointTemplate } from "./touchpoint-template.js";

/** Keeps touchpoint templates by code. */
export interface TouchpointTemplateStore {
  find(code: string): TouchpointTemplate | undefined;
  save(item: TouchpointTemplate): void;
  remove(code: string): boolean;
  list(): TouchpointTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTouchpointTemplateStore implements TouchpointTemplateStore {
  items: Map<string, TouchpointTemplate>;
  order: string[];

  constructor(items: Map<string, TouchpointTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TouchpointTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TouchpointTemplate): void {
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

  list(): TouchpointTemplate[] {
    const out: TouchpointTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTouchpointTemplateStore(): TouchpointTemplateStore {
  return new MemoryTouchpointTemplateStore(new Map<string, TouchpointTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTouchpointTemplateStore implements TouchpointTemplateStore {
  inner: TouchpointTemplateStore;
  cache: cache.TtlCache<TouchpointTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: TouchpointTemplateStore,
    cacheValue: cache.TtlCache<TouchpointTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TouchpointTemplate | undefined {
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

  save(item: TouchpointTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TouchpointTemplate[] {
    return this.inner.list();
  }
}

export function newCachedTouchpointTemplateStore(inner: TouchpointTemplateStore, ttl: number, clockValue: clock.Clock): TouchpointTemplateStore {
  return new CachedTouchpointTemplateStore(inner, cache.newTtlCache<TouchpointTemplate>(256, ttl, clockValue), 0, 0);
}

/** Selects touchpoint templates. Empty fields match all. */
export class TouchpointTemplateQuery {
  channel: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minThreshold: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TouchpointTemplate): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TouchpointTemplate[]): TouchpointTemplate[] {
    const matched = collections.filter(items, (candidate: TouchpointTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTouchpointTemplates(store: TouchpointTemplateStore, query: TouchpointTemplateQuery): TouchpointTemplate[] {
  return query.apply(store.list());
}
