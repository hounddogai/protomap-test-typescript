import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ActivationTemplate } from "./activation-template.js";

/** Keeps activation templates by code. */
export interface ActivationTemplateStore {
  find(code: string): ActivationTemplate | undefined;
  save(item: ActivationTemplate): void;
  remove(code: string): boolean;
  list(): ActivationTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryActivationTemplateStore implements ActivationTemplateStore {
  items: Map<string, ActivationTemplate>;
  order: string[];

  constructor(items: Map<string, ActivationTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ActivationTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ActivationTemplate): void {
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

  list(): ActivationTemplate[] {
    const out: ActivationTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryActivationTemplateStore(): ActivationTemplateStore {
  return new MemoryActivationTemplateStore(new Map<string, ActivationTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedActivationTemplateStore implements ActivationTemplateStore {
  inner: ActivationTemplateStore;
  cache: cache.TtlCache<ActivationTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: ActivationTemplateStore,
    cacheValue: cache.TtlCache<ActivationTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ActivationTemplate | undefined {
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

  save(item: ActivationTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ActivationTemplate[] {
    return this.inner.list();
  }
}

export function newCachedActivationTemplateStore(inner: ActivationTemplateStore, ttl: number, clockValue: clock.Clock): ActivationTemplateStore {
  return new CachedActivationTemplateStore(inner, cache.newTtlCache<ActivationTemplate>(1024, ttl, clockValue), 0, 0);
}

/** Selects activation templates. Empty fields match all. */
export class ActivationTemplateQuery {
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

  matches(item: ActivationTemplate): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ActivationTemplate[]): ActivationTemplate[] {
    const matched = collections.filter(items, (candidate: ActivationTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findActivationTemplates(store: ActivationTemplateStore, query: ActivationTemplateQuery): ActivationTemplate[] {
  return query.apply(store.list());
}
