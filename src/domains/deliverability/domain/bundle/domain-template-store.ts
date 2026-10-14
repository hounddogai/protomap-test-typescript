import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DomainTemplate } from "./domain-template.js";

/** Keeps domain templates by code. */
export interface DomainTemplateStore {
  find(code: string): DomainTemplate | undefined;
  save(item: DomainTemplate): void;
  remove(code: string): boolean;
  list(): DomainTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDomainTemplateStore implements DomainTemplateStore {
  items: Map<string, DomainTemplate>;
  order: string[];

  constructor(items: Map<string, DomainTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DomainTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DomainTemplate): void {
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

  list(): DomainTemplate[] {
    const out: DomainTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDomainTemplateStore(): DomainTemplateStore {
  return new MemoryDomainTemplateStore(new Map<string, DomainTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDomainTemplateStore implements DomainTemplateStore {
  inner: DomainTemplateStore;
  cache: cache.TtlCache<DomainTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: DomainTemplateStore,
    cacheValue: cache.TtlCache<DomainTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DomainTemplate | undefined {
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

  save(item: DomainTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DomainTemplate[] {
    return this.inner.list();
  }
}

export function newCachedDomainTemplateStore(inner: DomainTemplateStore, ttl: number, clockValue: clock.Clock): DomainTemplateStore {
  return new CachedDomainTemplateStore(inner, cache.newTtlCache<DomainTemplate>(512, ttl, clockValue), 0, 0);
}

/** Selects domain templates. Empty fields match all. */
export class DomainTemplateQuery {
  utmSource: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minOpenRate: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DomainTemplate): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DomainTemplate[]): DomainTemplate[] {
    const matched = collections.filter(items, (candidate: DomainTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDomainTemplates(store: DomainTemplateStore, query: DomainTemplateQuery): DomainTemplate[] {
  return query.apply(store.list());
}
