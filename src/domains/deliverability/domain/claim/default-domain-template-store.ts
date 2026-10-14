import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultDomainTemplate } from "./default-domain-template.js";

/** Keeps default domain templates by code. */
export interface DefaultDomainTemplateStore {
  find(code: string): DefaultDomainTemplate | undefined;
  save(item: DefaultDomainTemplate): void;
  remove(code: string): boolean;
  list(): DefaultDomainTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultDomainTemplateStore implements DefaultDomainTemplateStore {
  items: Map<string, DefaultDomainTemplate>;
  order: string[];

  constructor(items: Map<string, DefaultDomainTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultDomainTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultDomainTemplate): void {
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

  list(): DefaultDomainTemplate[] {
    const out: DefaultDomainTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultDomainTemplateStore(): DefaultDomainTemplateStore {
  return new MemoryDefaultDomainTemplateStore(new Map<string, DefaultDomainTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultDomainTemplateStore implements DefaultDomainTemplateStore {
  inner: DefaultDomainTemplateStore;
  cache: cache.TtlCache<DefaultDomainTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultDomainTemplateStore,
    cacheValue: cache.TtlCache<DefaultDomainTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultDomainTemplate | undefined {
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

  save(item: DefaultDomainTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultDomainTemplate[] {
    return this.inner.list();
  }
}

export function newCachedDefaultDomainTemplateStore(inner: DefaultDomainTemplateStore, ttl: number, clockValue: clock.Clock): DefaultDomainTemplateStore {
  return new CachedDefaultDomainTemplateStore(
    inner,
    cache.newTtlCache<DefaultDomainTemplate>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default domain templates. Empty fields match all. */
export class DefaultDomainTemplateQuery {
  utmSource: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minStartsAt: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultDomainTemplate): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultDomainTemplate[]): DefaultDomainTemplate[] {
    const matched = collections.filter(items, (candidate: DefaultDomainTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultDomainTemplates(store: DefaultDomainTemplateStore, query: DefaultDomainTemplateQuery): DefaultDomainTemplate[] {
  return query.apply(store.list());
}
