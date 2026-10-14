import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SlaPolicy } from "./sla-policy.js";

/** Keeps sla policies by code. */
export interface SlaPolicyStore {
  find(code: string): SlaPolicy | undefined;
  save(item: SlaPolicy): void;
  remove(code: string): boolean;
  list(): SlaPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySlaPolicyStore implements SlaPolicyStore {
  items: Map<string, SlaPolicy>;
  order: string[];

  constructor(items: Map<string, SlaPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SlaPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SlaPolicy): void {
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

  list(): SlaPolicy[] {
    const out: SlaPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySlaPolicyStore(): SlaPolicyStore {
  return new MemorySlaPolicyStore(new Map<string, SlaPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSlaPolicyStore implements SlaPolicyStore {
  inner: SlaPolicyStore;
  cache: cache.TtlCache<SlaPolicy>;
  hits: number;
  misses: number;

  constructor(inner: SlaPolicyStore, cacheValue: cache.TtlCache<SlaPolicy>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SlaPolicy | undefined {
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

  save(item: SlaPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SlaPolicy[] {
    return this.inner.list();
  }
}

export function newCachedSlaPolicyStore(inner: SlaPolicyStore, ttl: number, clockValue: clock.Clock): SlaPolicyStore {
  return new CachedSlaPolicyStore(inner, cache.newTtlCache<SlaPolicy>(512, ttl, clockValue), 0, 0);
}

/** Selects sla policies. Empty fields match all. */
export class SlaPolicyQuery {
  locale: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minAttempts: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SlaPolicy): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SlaPolicy[]): SlaPolicy[] {
    const matched = collections.filter(items, (candidate: SlaPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSlaPolicies(store: SlaPolicyStore, query: SlaPolicyQuery): SlaPolicy[] {
  return query.apply(store.list());
}
