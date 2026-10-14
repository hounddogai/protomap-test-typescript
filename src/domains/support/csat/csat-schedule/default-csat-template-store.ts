import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultCsatTemplate } from "./default-csat-template.js";

/** Keeps default csat templates by code. */
export interface DefaultCsatTemplateStore {
  find(code: string): DefaultCsatTemplate | undefined;
  save(item: DefaultCsatTemplate): void;
  remove(code: string): boolean;
  list(): DefaultCsatTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultCsatTemplateStore implements DefaultCsatTemplateStore {
  items: Map<string, DefaultCsatTemplate>;
  order: string[];

  constructor(items: Map<string, DefaultCsatTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultCsatTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultCsatTemplate): void {
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

  list(): DefaultCsatTemplate[] {
    const out: DefaultCsatTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultCsatTemplateStore(): DefaultCsatTemplateStore {
  return new MemoryDefaultCsatTemplateStore(new Map<string, DefaultCsatTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultCsatTemplateStore implements DefaultCsatTemplateStore {
  inner: DefaultCsatTemplateStore;
  cache: cache.TtlCache<DefaultCsatTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultCsatTemplateStore,
    cacheValue: cache.TtlCache<DefaultCsatTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultCsatTemplate | undefined {
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

  save(item: DefaultCsatTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultCsatTemplate[] {
    return this.inner.list();
  }
}

export function newCachedDefaultCsatTemplateStore(inner: DefaultCsatTemplateStore, ttl: number, clockValue: clock.Clock): DefaultCsatTemplateStore {
  return new CachedDefaultCsatTemplateStore(inner, cache.newTtlCache<DefaultCsatTemplate>(1024, ttl, clockValue), 0, 0);
}

/** Selects default csat templates. Empty fields match all. */
export class DefaultCsatTemplateQuery {
  name: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minOpenRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultCsatTemplate): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultCsatTemplate[]): DefaultCsatTemplate[] {
    const matched = collections.filter(items, (candidate: DefaultCsatTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultCsatTemplates(store: DefaultCsatTemplateStore, query: DefaultCsatTemplateQuery): DefaultCsatTemplate[] {
  return query.apply(store.list());
}
