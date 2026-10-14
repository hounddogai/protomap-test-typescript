import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultActivationTemplate } from "./default-activation-template.js";

/** Keeps default activation templates by code. */
export interface DefaultActivationTemplateStore {
  find(code: string): DefaultActivationTemplate | undefined;
  save(item: DefaultActivationTemplate): void;
  remove(code: string): boolean;
  list(): DefaultActivationTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultActivationTemplateStore implements DefaultActivationTemplateStore {
  items: Map<string, DefaultActivationTemplate>;
  order: string[];

  constructor(items: Map<string, DefaultActivationTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultActivationTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultActivationTemplate): void {
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

  list(): DefaultActivationTemplate[] {
    const out: DefaultActivationTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultActivationTemplateStore(): DefaultActivationTemplateStore {
  return new MemoryDefaultActivationTemplateStore(new Map<string, DefaultActivationTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultActivationTemplateStore implements DefaultActivationTemplateStore {
  inner: DefaultActivationTemplateStore;
  cache: cache.TtlCache<DefaultActivationTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultActivationTemplateStore,
    cacheValue: cache.TtlCache<DefaultActivationTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultActivationTemplate | undefined {
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

  save(item: DefaultActivationTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultActivationTemplate[] {
    return this.inner.list();
  }
}

export function newCachedDefaultActivationTemplateStore(inner: DefaultActivationTemplateStore, ttl: number, clockValue: clock.Clock): DefaultActivationTemplateStore {
  return new CachedDefaultActivationTemplateStore(
    inner,
    cache.newTtlCache<DefaultActivationTemplate>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default activation templates. Empty fields match all. */
export class DefaultActivationTemplateQuery {
  utmSource: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minBatchSize: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultActivationTemplate): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultActivationTemplate[]): DefaultActivationTemplate[] {
    const matched = collections.filter(items, (candidate: DefaultActivationTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultActivationTemplates(store: DefaultActivationTemplateStore, query: DefaultActivationTemplateQuery): DefaultActivationTemplate[] {
  return query.apply(store.list());
}
