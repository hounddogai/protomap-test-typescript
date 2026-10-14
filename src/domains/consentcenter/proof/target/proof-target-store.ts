import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ProofTarget } from "./proof-target.js";

/** Keeps proof targets by code. */
export interface ProofTargetStore {
  find(code: string): ProofTarget | undefined;
  save(item: ProofTarget): void;
  remove(code: string): boolean;
  list(): ProofTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryProofTargetStore implements ProofTargetStore {
  items: Map<string, ProofTarget>;
  order: string[];

  constructor(items: Map<string, ProofTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ProofTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ProofTarget): void {
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

  list(): ProofTarget[] {
    const out: ProofTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryProofTargetStore(): ProofTargetStore {
  return new MemoryProofTargetStore(new Map<string, ProofTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedProofTargetStore implements ProofTargetStore {
  inner: ProofTargetStore;
  cache: cache.TtlCache<ProofTarget>;
  hits: number;
  misses: number;

  constructor(inner: ProofTargetStore, cacheValue: cache.TtlCache<ProofTarget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ProofTarget | undefined {
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

  save(item: ProofTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ProofTarget[] {
    return this.inner.list();
  }
}

export function newCachedProofTargetStore(inner: ProofTargetStore, ttl: number, clockValue: clock.Clock): ProofTargetStore {
  return new CachedProofTargetStore(inner, cache.newTtlCache<ProofTarget>(512, ttl, clockValue), 0, 0);
}

/** Selects proof targets. Empty fields match all. */
export class ProofTargetQuery {
  channel: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minScore: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ProofTarget): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ProofTarget[]): ProofTarget[] {
    const matched = collections.filter(items, (candidate: ProofTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findProofTargets(store: ProofTargetStore, query: ProofTargetQuery): ProofTarget[] {
  return query.apply(store.list());
}
