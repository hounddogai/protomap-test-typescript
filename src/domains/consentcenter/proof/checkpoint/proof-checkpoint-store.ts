import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ProofCheckpoint } from "./proof-checkpoint.js";

/** Keeps proof checkpoints by code. */
export interface ProofCheckpointStore {
  find(code: string): ProofCheckpoint | undefined;
  save(item: ProofCheckpoint): void;
  remove(code: string): boolean;
  list(): ProofCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryProofCheckpointStore implements ProofCheckpointStore {
  items: Map<string, ProofCheckpoint>;
  order: string[];

  constructor(items: Map<string, ProofCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ProofCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ProofCheckpoint): void {
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

  list(): ProofCheckpoint[] {
    const out: ProofCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryProofCheckpointStore(): ProofCheckpointStore {
  return new MemoryProofCheckpointStore(new Map<string, ProofCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedProofCheckpointStore implements ProofCheckpointStore {
  inner: ProofCheckpointStore;
  cache: cache.TtlCache<ProofCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: ProofCheckpointStore,
    cacheValue: cache.TtlCache<ProofCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ProofCheckpoint | undefined {
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

  save(item: ProofCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ProofCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedProofCheckpointStore(inner: ProofCheckpointStore, ttl: number, clockValue: clock.Clock): ProofCheckpointStore {
  return new CachedProofCheckpointStore(inner, cache.newTtlCache<ProofCheckpoint>(64, ttl, clockValue), 0, 0);
}

/** Selects proof checkpoints. Empty fields match all. */
export class ProofCheckpointQuery {
  channel: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minOpenRate: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ProofCheckpoint): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ProofCheckpoint[]): ProofCheckpoint[] {
    const matched = collections.filter(items, (candidate: ProofCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findProofCheckpoints(store: ProofCheckpointStore, query: ProofCheckpointQuery): ProofCheckpoint[] {
  return query.apply(store.list());
}
