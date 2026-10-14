import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientTicketViewTemplate } from "./lenient-ticket-view-template.js";

/** Keeps lenient ticket view templates by code. */
export interface LenientTicketViewTemplateStore {
  find(code: string): LenientTicketViewTemplate | undefined;
  save(item: LenientTicketViewTemplate): void;
  remove(code: string): boolean;
  list(): LenientTicketViewTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientTicketViewTemplateStore implements LenientTicketViewTemplateStore {
  items: Map<string, LenientTicketViewTemplate>;
  order: string[];

  constructor(items: Map<string, LenientTicketViewTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientTicketViewTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientTicketViewTemplate): void {
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

  list(): LenientTicketViewTemplate[] {
    const out: LenientTicketViewTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientTicketViewTemplateStore(): LenientTicketViewTemplateStore {
  return new MemoryLenientTicketViewTemplateStore(new Map<string, LenientTicketViewTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientTicketViewTemplateStore implements LenientTicketViewTemplateStore {
  inner: LenientTicketViewTemplateStore;
  cache: cache.TtlCache<LenientTicketViewTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientTicketViewTemplateStore,
    cacheValue: cache.TtlCache<LenientTicketViewTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientTicketViewTemplate | undefined {
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

  save(item: LenientTicketViewTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientTicketViewTemplate[] {
    return this.inner.list();
  }
}

export function newCachedLenientTicketViewTemplateStore(inner: LenientTicketViewTemplateStore, ttl: number, clockValue: clock.Clock): LenientTicketViewTemplateStore {
  return new CachedLenientTicketViewTemplateStore(
    inner,
    cache.newTtlCache<LenientTicketViewTemplate>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient ticket view templates. Empty fields match all. */
export class LenientTicketViewTemplateQuery {
  title: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientTicketViewTemplate): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientTicketViewTemplate[]): LenientTicketViewTemplate[] {
    const matched = collections.filter(items, (candidate: LenientTicketViewTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientTicketViewTemplates(store: LenientTicketViewTemplateStore, query: LenientTicketViewTemplateQuery): LenientTicketViewTemplate[] {
  return query.apply(store.list());
}
