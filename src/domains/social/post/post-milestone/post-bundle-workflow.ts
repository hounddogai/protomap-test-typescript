import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PostBundleEngine, defaultPostBundleEngine } from "./post-bundle-engine.js";
import { PostBundleValidator, defaultPostBundleValidator } from "./post-bundle-rules.js";
import { PostBundleStore } from "./post-bundle-store.js";

/** Moves post bundles through their life cycle and keeps a journal of what it did. */
export class PostBundleDesk {
  store: PostBundleStore;
  validator: PostBundleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PostBundleEngine;

  constructor(
    store: PostBundleStore,
    validator: PostBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PostBundleEngine,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`post bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`post bundle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`post bundle ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newPostBundleDesk(store: PostBundleStore, clockValue: clock.Clock, flagsValue: flags.Registry): PostBundleDesk {
  return new PostBundleDesk(store, defaultPostBundleValidator(), clockValue, [], defaultPostBundleEngine(flagsValue));
}
