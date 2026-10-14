import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { StrictLevelAssignmentEngine, defaultStrictLevelAssignmentEngine } from "./strict-level-assignment-engine.js";
import {
  StrictLevelAssignmentValidator,
  defaultStrictLevelAssignmentValidator,
} from "./strict-level-assignment-rules.js";
import { StrictLevelAssignmentStore } from "./strict-level-assignment-store.js";

/** Moves strict level assignments through their life cycle and keeps a journal of what it did. */
export class StrictLevelAssignmentWorkflow {
  store: StrictLevelAssignmentStore;
  validator: StrictLevelAssignmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictLevelAssignmentEngine;

  constructor(
    store: StrictLevelAssignmentStore,
    validator: StrictLevelAssignmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictLevelAssignmentEngine,
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
      throw new Error(`strict level assignment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict level assignment ${code} not found`);
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
      throw new Error(`strict level assignment ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newStrictLevelAssignmentWorkflow(store: StrictLevelAssignmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): StrictLevelAssignmentWorkflow {
  return new StrictLevelAssignmentWorkflow(
    store,
    defaultStrictLevelAssignmentValidator(),
    clockValue,
    [],
    defaultStrictLevelAssignmentEngine(flagsValue),
  );
}
