import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CsatTemplate } from "./csat-template.js";

/** Keeps csat templates by code. */
export interface CsatTemplateStore {
  find(code: string): CsatTemplate | undefined;
  save(item: CsatTemplate): void;
  remove(code: string): boolean;
  list(): CsatTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCsatTemplateStore implements CsatTemplateStore {
  items: Map<string, CsatTemplate>;
  order: string[];

  constructor(items: Map<string, CsatTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CsatTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CsatTemplate): void {
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

  list(): CsatTemplate[] {
    const out: CsatTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCsatTemplateStore(): CsatTemplateStore {
  return new MemoryCsatTemplateStore(new Map<string, CsatTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCsatTemplateStore implements CsatTemplateStore {
  inner: CsatTemplateStore;
  cache: cache.TtlCache<CsatTemplate>;
  hits: number;
  misses: number;

  constructor(inner: CsatTemplateStore, cacheValue: cache.TtlCache<CsatTemplate>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CsatTemplate | undefined {
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

  save(item: CsatTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CsatTemplate[] {
    return this.inner.list();
  }
}

export function newCachedCsatTemplateStore(inner: CsatTemplateStore, ttl: number, clockValue: clock.Clock): CsatTemplateStore {
  return new CachedCsatTemplateStore(inner, cache.newTtlCache<CsatTemplate>(128, ttl, clockValue), 0, 0);
}

/** Selects csat templates. Empty fields match all. */
export class CsatTemplateQuery {
  label: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRate: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CsatTemplate): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CsatTemplate[]): CsatTemplate[] {
    const matched = collections.filter(items, (candidate: CsatTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCsatTemplates(store: CsatTemplateStore, query: CsatTemplateQuery): CsatTemplate[] {
  return query.apply(store.list());
}
