import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PostTemplate } from "./post-template.js";

/** Keeps post templates by code. */
export interface PostTemplateStore {
  find(code: string): PostTemplate | undefined;
  save(item: PostTemplate): void;
  remove(code: string): boolean;
  list(): PostTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPostTemplateStore implements PostTemplateStore {
  items: Map<string, PostTemplate>;
  order: string[];

  constructor(items: Map<string, PostTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PostTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PostTemplate): void {
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

  list(): PostTemplate[] {
    const out: PostTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPostTemplateStore(): PostTemplateStore {
  return new MemoryPostTemplateStore(new Map<string, PostTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPostTemplateStore implements PostTemplateStore {
  inner: PostTemplateStore;
  cache: cache.TtlCache<PostTemplate>;
  hits: number;
  misses: number;

  constructor(inner: PostTemplateStore, cacheValue: cache.TtlCache<PostTemplate>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PostTemplate | undefined {
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

  save(item: PostTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PostTemplate[] {
    return this.inner.list();
  }
}

export function newCachedPostTemplateStore(inner: PostTemplateStore, ttl: number, clockValue: clock.Clock): PostTemplateStore {
  return new CachedPostTemplateStore(inner, cache.newTtlCache<PostTemplate>(128, ttl, clockValue), 0, 0);
}

/** Selects post templates. Empty fields match all. */
export class PostTemplateQuery {
  name: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minScore: number, statuses: string[], limit: number) {
    this.name = name;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PostTemplate): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PostTemplate[]): PostTemplate[] {
    const matched = collections.filter(items, (candidate: PostTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPostTemplates(store: PostTemplateStore, query: PostTemplateQuery): PostTemplate[] {
  return query.apply(store.list());
}
