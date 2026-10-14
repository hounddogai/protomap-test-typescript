import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultPaywallCheckpoint } from "./default-paywall-checkpoint.js";

/** Keeps default paywall checkpoints by code. */
export interface DefaultPaywallCheckpointStore {
  find(code: string): DefaultPaywallCheckpoint | undefined;
  save(item: DefaultPaywallCheckpoint): void;
  remove(code: string): boolean;
  list(): DefaultPaywallCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultPaywallCheckpointStore implements DefaultPaywallCheckpointStore {
  items: Map<string, DefaultPaywallCheckpoint>;
  order: string[];

  constructor(items: Map<string, DefaultPaywallCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultPaywallCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultPaywallCheckpoint): void {
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

  list(): DefaultPaywallCheckpoint[] {
    const out: DefaultPaywallCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultPaywallCheckpointStore(): DefaultPaywallCheckpointStore {
  return new MemoryDefaultPaywallCheckpointStore(new Map<string, DefaultPaywallCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultPaywallCheckpointStore implements DefaultPaywallCheckpointStore {
  inner: DefaultPaywallCheckpointStore;
  cache: cache.TtlCache<DefaultPaywallCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultPaywallCheckpointStore,
    cacheValue: cache.TtlCache<DefaultPaywallCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultPaywallCheckpoint | undefined {
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

  save(item: DefaultPaywallCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultPaywallCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedDefaultPaywallCheckpointStore(inner: DefaultPaywallCheckpointStore, ttl: number, clockValue: clock.Clock): DefaultPaywallCheckpointStore {
  return new CachedDefaultPaywallCheckpointStore(
    inner,
    cache.newTtlCache<DefaultPaywallCheckpoint>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default paywall checkpoints. Empty fields match all. */
export class DefaultPaywallCheckpointQuery {
  locale: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minThreshold: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultPaywallCheckpoint): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultPaywallCheckpoint[]): DefaultPaywallCheckpoint[] {
    const matched = collections.filter(items, (candidate: DefaultPaywallCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultPaywallCheckpoints(store: DefaultPaywallCheckpointStore, query: DefaultPaywallCheckpointQuery): DefaultPaywallCheckpoint[] {
  return query.apply(store.list());
}
