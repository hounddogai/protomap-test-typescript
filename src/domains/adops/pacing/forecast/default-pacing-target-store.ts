import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultPacingTarget } from "./default-pacing-target.js";

/** Keeps default pacing targets by code. */
export interface DefaultPacingTargetStore {
  find(code: string): DefaultPacingTarget | undefined;
  save(item: DefaultPacingTarget): void;
  remove(code: string): boolean;
  list(): DefaultPacingTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultPacingTargetStore implements DefaultPacingTargetStore {
  items: Map<string, DefaultPacingTarget>;
  order: string[];

  constructor(items: Map<string, DefaultPacingTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultPacingTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultPacingTarget): void {
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

  list(): DefaultPacingTarget[] {
    const out: DefaultPacingTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultPacingTargetStore(): DefaultPacingTargetStore {
  return new MemoryDefaultPacingTargetStore(new Map<string, DefaultPacingTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultPacingTargetStore implements DefaultPacingTargetStore {
  inner: DefaultPacingTargetStore;
  cache: cache.TtlCache<DefaultPacingTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultPacingTargetStore,
    cacheValue: cache.TtlCache<DefaultPacingTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultPacingTarget | undefined {
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

  save(item: DefaultPacingTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultPacingTarget[] {
    return this.inner.list();
  }
}

export function newCachedDefaultPacingTargetStore(inner: DefaultPacingTargetStore, ttl: number, clockValue: clock.Clock): DefaultPacingTargetStore {
  return new CachedDefaultPacingTargetStore(inner, cache.newTtlCache<DefaultPacingTarget>(512, ttl, clockValue), 0, 0);
}

/** Selects default pacing targets. Empty fields match all. */
export class DefaultPacingTargetQuery {
  locale: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minMargin: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultPacingTarget): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultPacingTarget[]): DefaultPacingTarget[] {
    const matched = collections.filter(items, (candidate: DefaultPacingTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultPacingTargets(store: DefaultPacingTargetStore, query: DefaultPacingTargetQuery): DefaultPacingTarget[] {
  return query.apply(store.list());
}
