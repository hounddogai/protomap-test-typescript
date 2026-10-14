import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EscalationEntry } from "./escalation-entry.js";

/** Keeps escalation entries by code. */
export interface EscalationEntryStore {
  find(code: string): EscalationEntry | undefined;
  save(item: EscalationEntry): void;
  remove(code: string): boolean;
  list(): EscalationEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEscalationEntryStore implements EscalationEntryStore {
  items: Map<string, EscalationEntry>;
  order: string[];

  constructor(items: Map<string, EscalationEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EscalationEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EscalationEntry): void {
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

  list(): EscalationEntry[] {
    const out: EscalationEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEscalationEntryStore(): EscalationEntryStore {
  return new MemoryEscalationEntryStore(new Map<string, EscalationEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEscalationEntryStore implements EscalationEntryStore {
  inner: EscalationEntryStore;
  cache: cache.TtlCache<EscalationEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: EscalationEntryStore,
    cacheValue: cache.TtlCache<EscalationEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EscalationEntry | undefined {
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

  save(item: EscalationEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EscalationEntry[] {
    return this.inner.list();
  }
}

export function newCachedEscalationEntryStore(inner: EscalationEntryStore, ttl: number, clockValue: clock.Clock): EscalationEntryStore {
  return new CachedEscalationEntryStore(inner, cache.newTtlCache<EscalationEntry>(1024, ttl, clockValue), 0, 0);
}

/** Selects escalation entries. Empty fields match all. */
export class EscalationEntryQuery {
  country: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minSendAt: number, statuses: string[], limit: number) {
    this.country = country;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EscalationEntry): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EscalationEntry[]): EscalationEntry[] {
    const matched = collections.filter(items, (candidate: EscalationEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEscalationEntries(store: EscalationEntryStore, query: EscalationEntryQuery): EscalationEntry[] {
  return query.apply(store.list());
}
