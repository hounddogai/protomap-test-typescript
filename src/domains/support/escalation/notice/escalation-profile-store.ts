import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EscalationProfile } from "./escalation-profile.js";

/** Keeps escalation profiles by code. */
export interface EscalationProfileStore {
  find(code: string): EscalationProfile | undefined;
  save(item: EscalationProfile): void;
  remove(code: string): boolean;
  list(): EscalationProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEscalationProfileStore implements EscalationProfileStore {
  items: Map<string, EscalationProfile>;
  order: string[];

  constructor(items: Map<string, EscalationProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EscalationProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EscalationProfile): void {
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

  list(): EscalationProfile[] {
    const out: EscalationProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEscalationProfileStore(): EscalationProfileStore {
  return new MemoryEscalationProfileStore(new Map<string, EscalationProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEscalationProfileStore implements EscalationProfileStore {
  inner: EscalationProfileStore;
  cache: cache.TtlCache<EscalationProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: EscalationProfileStore,
    cacheValue: cache.TtlCache<EscalationProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EscalationProfile | undefined {
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

  save(item: EscalationProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EscalationProfile[] {
    return this.inner.list();
  }
}

export function newCachedEscalationProfileStore(inner: EscalationProfileStore, ttl: number, clockValue: clock.Clock): EscalationProfileStore {
  return new CachedEscalationProfileStore(inner, cache.newTtlCache<EscalationProfile>(1024, ttl, clockValue), 0, 0);
}

/** Selects escalation profiles. Empty fields match all. */
export class EscalationProfileQuery {
  region: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minEndsAt: number, statuses: string[], limit: number) {
    this.region = region;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EscalationProfile): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EscalationProfile[]): EscalationProfile[] {
    const matched = collections.filter(items, (candidate: EscalationProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEscalationProfiles(store: EscalationProfileStore, query: EscalationProfileQuery): EscalationProfile[] {
  return query.apply(store.list());
}
