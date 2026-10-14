import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultActivationTarget } from "./default-activation-target.js";

/** Keeps default activation targets by code. */
export interface DefaultActivationTargetStore {
  find(code: string): DefaultActivationTarget | undefined;
  save(item: DefaultActivationTarget): void;
  remove(code: string): boolean;
  list(): DefaultActivationTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultActivationTargetStore implements DefaultActivationTargetStore {
  items: Map<string, DefaultActivationTarget>;
  order: string[];

  constructor(items: Map<string, DefaultActivationTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultActivationTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultActivationTarget): void {
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

  list(): DefaultActivationTarget[] {
    const out: DefaultActivationTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultActivationTargetStore(): DefaultActivationTargetStore {
  return new MemoryDefaultActivationTargetStore(new Map<string, DefaultActivationTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultActivationTargetStore implements DefaultActivationTargetStore {
  inner: DefaultActivationTargetStore;
  cache: cache.TtlCache<DefaultActivationTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultActivationTargetStore,
    cacheValue: cache.TtlCache<DefaultActivationTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultActivationTarget | undefined {
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

  save(item: DefaultActivationTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultActivationTarget[] {
    return this.inner.list();
  }
}

export function newCachedDefaultActivationTargetStore(inner: DefaultActivationTargetStore, ttl: number, clockValue: clock.Clock): DefaultActivationTargetStore {
  return new CachedDefaultActivationTargetStore(
    inner,
    cache.newTtlCache<DefaultActivationTarget>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default activation targets. Empty fields match all. */
export class DefaultActivationTargetQuery {
  source: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minWeight: number, statuses: string[], limit: number) {
    this.source = source;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultActivationTarget): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultActivationTarget[]): DefaultActivationTarget[] {
    const matched = collections.filter(items, (candidate: DefaultActivationTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultActivationTargets(store: DefaultActivationTargetStore, query: DefaultActivationTargetQuery): DefaultActivationTarget[] {
  return query.apply(store.list());
}
