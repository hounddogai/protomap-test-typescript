import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PostProfileEngine, defaultPostProfileEngine } from "./post-profile-engine.js";
import { PostProfileValidator, defaultPostProfileValidator } from "./post-profile-rules.js";
import { PostProfileStore } from "./post-profile-store.js";

/** Moves post profiles through their life cycle and keeps a journal of what it did. */
export class PostProfileCoordinator {
  store: PostProfileStore;
  validator: PostProfileValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PostProfileEngine;

  constructor(
    store: PostProfileStore,
    validator: PostProfileValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PostProfileEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`post profile ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`post profile ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`post profile ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPostProfileCoordinator(store: PostProfileStore, clockValue: clock.Clock, flagsValue: flags.Registry): PostProfileCoordinator {
  return new PostProfileCoordinator(
    store,
    defaultPostProfileValidator(),
    clockValue,
    [],
    defaultPostProfileEngine(flagsValue),
  );
}
