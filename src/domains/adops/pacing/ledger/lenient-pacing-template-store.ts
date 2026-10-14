import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientPacingTemplate } from "./lenient-pacing-template.js";

/** Keeps lenient pacing templates by code. */
export interface LenientPacingTemplateStore {
  find(code: string): LenientPacingTemplate | undefined;
  save(item: LenientPacingTemplate): void;
  remove(code: string): boolean;
  list(): LenientPacingTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientPacingTemplateStore implements LenientPacingTemplateStore {
  items: Map<string, LenientPacingTemplate>;
  order: string[];

  constructor(items: Map<string, LenientPacingTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientPacingTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientPacingTemplate): void {
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

  list(): LenientPacingTemplate[] {
    const out: LenientPacingTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientPacingTemplateStore(): LenientPacingTemplateStore {
  return new MemoryLenientPacingTemplateStore(new Map<string, LenientPacingTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientPacingTemplateStore implements LenientPacingTemplateStore {
  inner: LenientPacingTemplateStore;
  cache: cache.TtlCache<LenientPacingTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientPacingTemplateStore,
    cacheValue: cache.TtlCache<LenientPacingTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientPacingTemplate | undefined {
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

  save(item: LenientPacingTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientPacingTemplate[] {
    return this.inner.list();
  }
}

export function newCachedLenientPacingTemplateStore(inner: LenientPacingTemplateStore, ttl: number, clockValue: clock.Clock): LenientPacingTemplateStore {
  return new CachedLenientPacingTemplateStore(
    inner,
    cache.newTtlCache<LenientPacingTemplate>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient pacing templates. Empty fields match all. */
export class LenientPacingTemplateQuery {
  label: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBid: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientPacingTemplate): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientPacingTemplate[]): LenientPacingTemplate[] {
    const matched = collections.filter(items, (candidate: LenientPacingTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientPacingTemplates(store: LenientPacingTemplateStore, query: LenientPacingTemplateQuery): LenientPacingTemplate[] {
  return query.apply(store.list());
}
