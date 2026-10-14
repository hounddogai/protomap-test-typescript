import * as clock from "../../../../kit/clock.js";
import { StepRollupValidator, defaultStepRollupValidator } from "./step-rollup-rules.js";
import { StepRollupStore } from "./step-rollup-store.js";

/** Moves step rollups through their life cycle and keeps a journal of what it did. */
export class StepRollupCoordinator {
  store: StepRollupStore;
  validator: StepRollupValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(store: StepRollupStore, validator: StepRollupValidator, clockValue: clock.Clock, journal: string[]) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`step rollup ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`step rollup ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
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

export function newStepRollupCoordinator(store: StepRollupStore, clockValue: clock.Clock): StepRollupCoordinator {
  return new StepRollupCoordinator(store, defaultStepRollupValidator(), clockValue, []);
}
