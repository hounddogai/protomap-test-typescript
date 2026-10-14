import * as clock from "../../../../kit/clock.js";
import { RollingWaitProfileEngine, defaultRollingWaitProfileEngine } from "./rolling-wait-profile-engine.js";
import { RollingWaitProfileValidator, defaultRollingWaitProfileValidator } from "./rolling-wait-profile-rules.js";
import { RollingWaitProfileStore } from "./rolling-wait-profile-store.js";

/** Moves rolling wait profiles through their life cycle and keeps a journal of what it did. */
export class RollingWaitProfileWorkflow {
  store: RollingWaitProfileStore;
  validator: RollingWaitProfileValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingWaitProfileEngine;

  constructor(
    store: RollingWaitProfileStore,
    validator: RollingWaitProfileValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingWaitProfileEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling wait profile ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling wait profile ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling wait profile ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newRollingWaitProfileWorkflow(store: RollingWaitProfileStore, clockValue: clock.Clock): RollingWaitProfileWorkflow {
  return new RollingWaitProfileWorkflow(
    store,
    defaultRollingWaitProfileValidator(),
    clockValue,
    [],
    defaultRollingWaitProfileEngine(),
  );
}
