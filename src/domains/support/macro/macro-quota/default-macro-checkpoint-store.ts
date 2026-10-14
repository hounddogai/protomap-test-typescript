import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultMacroCheckpoint } from "./default-macro-checkpoint.js";

/** Keeps default macro checkpoints by code. */
export interface DefaultMacroCheckpointStore {
  find(code: string): DefaultMacroCheckpoint | undefined;
  save(item: DefaultMacroCheckpoint): void;
  remove(code: string): boolean;
  list(): DefaultMacroCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultMacroCheckpointStore implements DefaultMacroCheckpointStore {
  items: Map<string, DefaultMacroCheckpoint>;
  order: string[];

  constructor(items: Map<string, DefaultMacroCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultMacroCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultMacroCheckpoint): void {
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

  list(): DefaultMacroCheckpoint[] {
    const out: DefaultMacroCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultMacroCheckpointStore(): DefaultMacroCheckpointStore {
  return new MemoryDefaultMacroCheckpointStore(new Map<string, DefaultMacroCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultMacroCheckpointStore implements DefaultMacroCheckpointStore {
  inner: DefaultMacroCheckpointStore;
  cache: cache.TtlCache<DefaultMacroCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultMacroCheckpointStore,
    cacheValue: cache.TtlCache<DefaultMacroCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultMacroCheckpoint | undefined {
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

  save(item: DefaultMacroCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultMacroCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedDefaultMacroCheckpointStore(inner: DefaultMacroCheckpointStore, ttl: number, clockValue: clock.Clock): DefaultMacroCheckpointStore {
  return new CachedDefaultMacroCheckpointStore(
    inner,
    cache.newTtlCache<DefaultMacroCheckpoint>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default macro checkpoints. Empty fields match all. */
export class DefaultMacroCheckpointQuery {
  title: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minThreshold: number, statuses: string[], limit: number) {
    this.title = title;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultMacroCheckpoint): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultMacroCheckpoint[]): DefaultMacroCheckpoint[] {
    const matched = collections.filter(items, (candidate: DefaultMacroCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultMacroCheckpoints(store: DefaultMacroCheckpointStore, query: DefaultMacroCheckpointQuery): DefaultMacroCheckpoint[] {
  return query.apply(store.list());
}
