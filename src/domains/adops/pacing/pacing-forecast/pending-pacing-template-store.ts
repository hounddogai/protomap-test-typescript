import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingPacingTemplate } from "./pending-pacing-template.js";

/** Keeps pending pacing templates by code. */
export interface PendingPacingTemplateStore {
  find(code: string): PendingPacingTemplate | undefined;
  save(item: PendingPacingTemplate): void;
  remove(code: string): boolean;
  list(): PendingPacingTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingPacingTemplateStore implements PendingPacingTemplateStore {
  items: Map<string, PendingPacingTemplate>;
  order: string[];

  constructor(items: Map<string, PendingPacingTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingPacingTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingPacingTemplate): void {
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

  list(): PendingPacingTemplate[] {
    const out: PendingPacingTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingPacingTemplateStore(): PendingPacingTemplateStore {
  return new MemoryPendingPacingTemplateStore(new Map<string, PendingPacingTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingPacingTemplateStore implements PendingPacingTemplateStore {
  inner: PendingPacingTemplateStore;
  cache: cache.TtlCache<PendingPacingTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingPacingTemplateStore,
    cacheValue: cache.TtlCache<PendingPacingTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingPacingTemplate | undefined {
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

  save(item: PendingPacingTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingPacingTemplate[] {
    return this.inner.list();
  }
}

export function newCachedPendingPacingTemplateStore(inner: PendingPacingTemplateStore, ttl: number, clockValue: clock.Clock): PendingPacingTemplateStore {
  return new CachedPendingPacingTemplateStore(
    inner,
    cache.newTtlCache<PendingPacingTemplate>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending pacing templates. Empty fields match all. */
export class PendingPacingTemplateQuery {
  category: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minLimit: number, statuses: string[], limit: number) {
    this.category = category;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingPacingTemplate): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingPacingTemplate[]): PendingPacingTemplate[] {
    const matched = collections.filter(items, (candidate: PendingPacingTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingPacingTemplates(store: PendingPacingTemplateStore, query: PendingPacingTemplateQuery): PendingPacingTemplate[] {
  return query.apply(store.list());
}
