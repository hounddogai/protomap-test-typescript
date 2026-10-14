import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ExitRuleManifest } from "./exit-rule-manifest.js";

/** Keeps exit rule manifests by code. */
export interface ExitRuleManifestStore {
  find(code: string): ExitRuleManifest | undefined;
  save(item: ExitRuleManifest): void;
  remove(code: string): boolean;
  list(): ExitRuleManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryExitRuleManifestStore implements ExitRuleManifestStore {
  items: Map<string, ExitRuleManifest>;
  order: string[];

  constructor(items: Map<string, ExitRuleManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ExitRuleManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ExitRuleManifest): void {
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

  list(): ExitRuleManifest[] {
    const out: ExitRuleManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryExitRuleManifestStore(): ExitRuleManifestStore {
  return new MemoryExitRuleManifestStore(new Map<string, ExitRuleManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedExitRuleManifestStore implements ExitRuleManifestStore {
  inner: ExitRuleManifestStore;
  cache: cache.TtlCache<ExitRuleManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: ExitRuleManifestStore,
    cacheValue: cache.TtlCache<ExitRuleManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ExitRuleManifest | undefined {
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

  save(item: ExitRuleManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ExitRuleManifest[] {
    return this.inner.list();
  }
}

export function newCachedExitRuleManifestStore(inner: ExitRuleManifestStore, ttl: number, clockValue: clock.Clock): ExitRuleManifestStore {
  return new CachedExitRuleManifestStore(inner, cache.newTtlCache<ExitRuleManifest>(256, ttl, clockValue), 0, 0);
}

/** Selects exit rule manifests. Empty fields match all. */
export class ExitRuleManifestQuery {
  locale: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minStartsAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ExitRuleManifest): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ExitRuleManifest[]): ExitRuleManifest[] {
    const matched = collections.filter(items, (candidate: ExitRuleManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findExitRuleManifests(store: ExitRuleManifestStore, query: ExitRuleManifestQuery): ExitRuleManifest[] {
  return query.apply(store.list());
}
