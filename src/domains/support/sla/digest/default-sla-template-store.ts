import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultSlaTemplate } from "./default-sla-template.js";

/** Keeps default sla templates by code. */
export interface DefaultSlaTemplateStore {
  find(code: string): DefaultSlaTemplate | undefined;
  save(item: DefaultSlaTemplate): void;
  remove(code: string): boolean;
  list(): DefaultSlaTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultSlaTemplateStore implements DefaultSlaTemplateStore {
  items: Map<string, DefaultSlaTemplate>;
  order: string[];

  constructor(items: Map<string, DefaultSlaTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultSlaTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultSlaTemplate): void {
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

  list(): DefaultSlaTemplate[] {
    const out: DefaultSlaTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultSlaTemplateStore(): DefaultSlaTemplateStore {
  return new MemoryDefaultSlaTemplateStore(new Map<string, DefaultSlaTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultSlaTemplateStore implements DefaultSlaTemplateStore {
  inner: DefaultSlaTemplateStore;
  cache: cache.TtlCache<DefaultSlaTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultSlaTemplateStore,
    cacheValue: cache.TtlCache<DefaultSlaTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultSlaTemplate | undefined {
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

  save(item: DefaultSlaTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultSlaTemplate[] {
    return this.inner.list();
  }
}

export function newCachedDefaultSlaTemplateStore(inner: DefaultSlaTemplateStore, ttl: number, clockValue: clock.Clock): DefaultSlaTemplateStore {
  return new CachedDefaultSlaTemplateStore(inner, cache.newTtlCache<DefaultSlaTemplate>(128, ttl, clockValue), 0, 0);
}

/** Selects default sla templates. Empty fields match all. */
export class DefaultSlaTemplateQuery {
  locale: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBid: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultSlaTemplate): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultSlaTemplate[]): DefaultSlaTemplate[] {
    const matched = collections.filter(items, (candidate: DefaultSlaTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultSlaTemplates(store: DefaultSlaTemplateStore, query: DefaultSlaTemplateQuery): DefaultSlaTemplate[] {
  return query.apply(store.list());
}
