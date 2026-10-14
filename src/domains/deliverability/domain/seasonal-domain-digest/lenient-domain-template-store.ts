import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientDomainTemplate } from "./lenient-domain-template.js";

/** Keeps lenient domain templates by code. */
export interface LenientDomainTemplateStore {
  find(code: string): LenientDomainTemplate | undefined;
  save(item: LenientDomainTemplate): void;
  remove(code: string): boolean;
  list(): LenientDomainTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientDomainTemplateStore implements LenientDomainTemplateStore {
  items: Map<string, LenientDomainTemplate>;
  order: string[];

  constructor(items: Map<string, LenientDomainTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientDomainTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientDomainTemplate): void {
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

  list(): LenientDomainTemplate[] {
    const out: LenientDomainTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientDomainTemplateStore(): LenientDomainTemplateStore {
  return new MemoryLenientDomainTemplateStore(new Map<string, LenientDomainTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientDomainTemplateStore implements LenientDomainTemplateStore {
  inner: LenientDomainTemplateStore;
  cache: cache.TtlCache<LenientDomainTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientDomainTemplateStore,
    cacheValue: cache.TtlCache<LenientDomainTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientDomainTemplate | undefined {
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

  save(item: LenientDomainTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientDomainTemplate[] {
    return this.inner.list();
  }
}

export function newCachedLenientDomainTemplateStore(inner: LenientDomainTemplateStore, ttl: number, clockValue: clock.Clock): LenientDomainTemplateStore {
  return new CachedLenientDomainTemplateStore(
    inner,
    cache.newTtlCache<LenientDomainTemplate>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient domain templates. Empty fields match all. */
export class LenientDomainTemplateQuery {
  utmSource: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minSequence: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientDomainTemplate): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientDomainTemplate[]): LenientDomainTemplate[] {
    const matched = collections.filter(items, (candidate: LenientDomainTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientDomainTemplates(store: LenientDomainTemplateStore, query: LenientDomainTemplateQuery): LenientDomainTemplate[] {
  return query.apply(store.list());
}
