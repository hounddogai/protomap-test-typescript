import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveQueueTemplate } from "./adaptive-queue-template.js";

/** Keeps adaptive queue templates by code. */
export interface AdaptiveQueueTemplateStore {
  find(code: string): AdaptiveQueueTemplate | undefined;
  save(item: AdaptiveQueueTemplate): void;
  remove(code: string): boolean;
  list(): AdaptiveQueueTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveQueueTemplateStore implements AdaptiveQueueTemplateStore {
  items: Map<string, AdaptiveQueueTemplate>;
  order: string[];

  constructor(items: Map<string, AdaptiveQueueTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveQueueTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveQueueTemplate): void {
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

  list(): AdaptiveQueueTemplate[] {
    const out: AdaptiveQueueTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveQueueTemplateStore(): AdaptiveQueueTemplateStore {
  return new MemoryAdaptiveQueueTemplateStore(new Map<string, AdaptiveQueueTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveQueueTemplateStore implements AdaptiveQueueTemplateStore {
  inner: AdaptiveQueueTemplateStore;
  cache: cache.TtlCache<AdaptiveQueueTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveQueueTemplateStore,
    cacheValue: cache.TtlCache<AdaptiveQueueTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveQueueTemplate | undefined {
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

  save(item: AdaptiveQueueTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveQueueTemplate[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveQueueTemplateStore(inner: AdaptiveQueueTemplateStore, ttl: number, clockValue: clock.Clock): AdaptiveQueueTemplateStore {
  return new CachedAdaptiveQueueTemplateStore(
    inner,
    cache.newTtlCache<AdaptiveQueueTemplate>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive queue templates. Empty fields match all. */
export class AdaptiveQueueTemplateQuery {
  channel: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minSendAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveQueueTemplate): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveQueueTemplate[]): AdaptiveQueueTemplate[] {
    const matched = collections.filter(items, (candidate: AdaptiveQueueTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveQueueTemplates(store: AdaptiveQueueTemplateStore, query: AdaptiveQueueTemplateQuery): AdaptiveQueueTemplate[] {
  return query.apply(store.list());
}
