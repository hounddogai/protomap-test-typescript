import * as clock from "../../../../kit/clock.js";
import { PostOverrideEngine, defaultPostOverrideEngine } from "./post-override-engine.js";
import { PostOverrideValidator, defaultPostOverrideValidator } from "./post-override-rules.js";
import { PostOverrideStore } from "./post-override-store.js";

/** Moves post overrides through their life cycle and keeps a journal of what it did. */
export class PostOverrideService {
  store: PostOverrideStore;
  validator: PostOverrideValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PostOverrideEngine;

  constructor(
    store: PostOverrideStore,
    validator: PostOverrideValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PostOverrideEngine,
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
    this.engine = engine;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`post override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`post override ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`post override ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPostOverrideService(store: PostOverrideStore, clockValue: clock.Clock): PostOverrideService {
  return new PostOverrideService(store, defaultPostOverrideValidator(), clockValue, [], defaultPostOverrideEngine());
}
