import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LevelAudit } from "./level-audit.js";

/** Keeps level audits by code. */
export interface LevelAuditStore {
  find(code: string): LevelAudit | undefined;
  save(item: LevelAudit): void;
  remove(code: string): boolean;
  list(): LevelAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLevelAuditStore implements LevelAuditStore {
  items: Map<string, LevelAudit>;
  order: string[];

  constructor(items: Map<string, LevelAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LevelAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LevelAudit): void {
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

  list(): LevelAudit[] {
    const out: LevelAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLevelAuditStore(): LevelAuditStore {
  return new MemoryLevelAuditStore(new Map<string, LevelAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLevelAuditStore implements LevelAuditStore {
  inner: LevelAuditStore;
  cache: cache.TtlCache<LevelAudit>;
  hits: number;
  misses: number;

  constructor(inner: LevelAuditStore, cacheValue: cache.TtlCache<LevelAudit>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LevelAudit | undefined {
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

  save(item: LevelAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LevelAudit[] {
    return this.inner.list();
  }
}

export function newCachedLevelAuditStore(inner: LevelAuditStore, ttl: number, clockValue: clock.Clock): LevelAuditStore {
  return new CachedLevelAuditStore(inner, cache.newTtlCache<LevelAudit>(64, ttl, clockValue), 0, 0);
}

/** Selects level audits. Empty fields match all. */
export class LevelAuditQuery {
  channel: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LevelAudit): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LevelAudit[]): LevelAudit[] {
    const matched = collections.filter(items, (candidate: LevelAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLevelAudits(store: LevelAuditStore, query: LevelAuditQuery): LevelAudit[] {
  return query.apply(store.list());
}
