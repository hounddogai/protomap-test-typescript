import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreativeTarget } from "./creative-target.js";

/** Keeps creative targets by code. */
export interface CreativeTargetStore {
  find(code: string): CreativeTarget | undefined;
  save(item: CreativeTarget): void;
  remove(code: string): boolean;
  list(): CreativeTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreativeTargetStore implements CreativeTargetStore {
  items: Map<string, CreativeTarget>;
  order: string[];

  constructor(items: Map<string, CreativeTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreativeTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreativeTarget): void {
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

  list(): CreativeTarget[] {
    const out: CreativeTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreativeTargetStore(): CreativeTargetStore {
  return new MemoryCreativeTargetStore(new Map<string, CreativeTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreativeTargetStore implements CreativeTargetStore {
  inner: CreativeTargetStore;
  cache: cache.TtlCache<CreativeTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: CreativeTargetStore,
    cacheValue: cache.TtlCache<CreativeTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreativeTarget | undefined {
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

  save(item: CreativeTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreativeTarget[] {
    return this.inner.list();
  }
}

export function newCachedCreativeTargetStore(inner: CreativeTargetStore, ttl: number, clockValue: clock.Clock): CreativeTargetStore {
  return new CachedCreativeTargetStore(inner, cache.newTtlCache<CreativeTarget>(256, ttl, clockValue), 0, 0);
}

/** Selects creative targets. Empty fields match all. */
export class CreativeTargetQuery {
  source: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minThreshold: number, statuses: string[], limit: number) {
    this.source = source;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreativeTarget): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreativeTarget[]): CreativeTarget[] {
    const matched = collections.filter(items, (candidate: CreativeTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreativeTargets(store: CreativeTargetStore, query: CreativeTargetQuery): CreativeTarget[] {
  return query.apply(store.list());
}
