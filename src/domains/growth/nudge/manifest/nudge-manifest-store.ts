import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { NudgeManifest } from "./nudge-manifest.js";

/** Keeps nudge manifests by code. */
export interface NudgeManifestStore {
  find(code: string): NudgeManifest | undefined;
  save(item: NudgeManifest): void;
  remove(code: string): boolean;
  list(): NudgeManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryNudgeManifestStore implements NudgeManifestStore {
  items: Map<string, NudgeManifest>;
  order: string[];

  constructor(items: Map<string, NudgeManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): NudgeManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: NudgeManifest): void {
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

  list(): NudgeManifest[] {
    const out: NudgeManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryNudgeManifestStore(): NudgeManifestStore {
  return new MemoryNudgeManifestStore(new Map<string, NudgeManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedNudgeManifestStore implements NudgeManifestStore {
  inner: NudgeManifestStore;
  cache: cache.TtlCache<NudgeManifest>;
  hits: number;
  misses: number;

  constructor(inner: NudgeManifestStore, cacheValue: cache.TtlCache<NudgeManifest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): NudgeManifest | undefined {
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

  save(item: NudgeManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): NudgeManifest[] {
    return this.inner.list();
  }
}

export function newCachedNudgeManifestStore(inner: NudgeManifestStore, ttl: number, clockValue: clock.Clock): NudgeManifestStore {
  return new CachedNudgeManifestStore(inner, cache.newTtlCache<NudgeManifest>(1024, ttl, clockValue), 0, 0);
}

/** Selects nudge manifests. Empty fields match all. */
export class NudgeManifestQuery {
  channel: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBudget: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: NudgeManifest): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: NudgeManifest[]): NudgeManifest[] {
    const matched = collections.filter(items, (candidate: NudgeManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findNudgeManifests(store: NudgeManifestStore, query: NudgeManifestQuery): NudgeManifest[] {
  return query.apply(store.list());
}
