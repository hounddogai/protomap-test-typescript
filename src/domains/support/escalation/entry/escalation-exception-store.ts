import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EscalationException } from "./escalation-exception.js";

/** Keeps escalation exceptions by code. */
export interface EscalationExceptionStore {
  find(code: string): EscalationException | undefined;
  save(item: EscalationException): void;
  remove(code: string): boolean;
  list(): EscalationException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEscalationExceptionStore implements EscalationExceptionStore {
  items: Map<string, EscalationException>;
  order: string[];

  constructor(items: Map<string, EscalationException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EscalationException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EscalationException): void {
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

  list(): EscalationException[] {
    const out: EscalationException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEscalationExceptionStore(): EscalationExceptionStore {
  return new MemoryEscalationExceptionStore(new Map<string, EscalationException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEscalationExceptionStore implements EscalationExceptionStore {
  inner: EscalationExceptionStore;
  cache: cache.TtlCache<EscalationException>;
  hits: number;
  misses: number;

  constructor(
    inner: EscalationExceptionStore,
    cacheValue: cache.TtlCache<EscalationException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EscalationException | undefined {
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

  save(item: EscalationException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EscalationException[] {
    return this.inner.list();
  }
}

export function newCachedEscalationExceptionStore(inner: EscalationExceptionStore, ttl: number, clockValue: clock.Clock): EscalationExceptionStore {
  return new CachedEscalationExceptionStore(inner, cache.newTtlCache<EscalationException>(512, ttl, clockValue), 0, 0);
}

/** Selects escalation exceptions. Empty fields match all. */
export class EscalationExceptionQuery {
  name: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minStartsAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EscalationException): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EscalationException[]): EscalationException[] {
    const matched = collections.filter(items, (candidate: EscalationException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEscalationExceptions(store: EscalationExceptionStore, query: EscalationExceptionQuery): EscalationException[] {
  return query.apply(store.list());
}
