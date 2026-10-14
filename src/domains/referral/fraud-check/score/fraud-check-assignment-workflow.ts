import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { FraudCheckAssignmentEngine, defaultFraudCheckAssignmentEngine } from "./fraud-check-assignment-engine.js";
import {
  FraudCheckAssignmentValidator,
  defaultFraudCheckAssignmentValidator,
} from "./fraud-check-assignment-rules.js";
import { FraudCheckAssignmentStore } from "./fraud-check-assignment-store.js";

/** Moves fraud check assignments through their life cycle and keeps a journal of what it did. */
export class FraudCheckAssignmentDesk {
  store: FraudCheckAssignmentStore;
  validator: FraudCheckAssignmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FraudCheckAssignmentEngine;

  constructor(
    store: FraudCheckAssignmentStore,
    validator: FraudCheckAssignmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FraudCheckAssignmentEngine,
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
      throw new Error(`fraud check assignment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fraud check assignment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fraud check assignment ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newFraudCheckAssignmentDesk(store: FraudCheckAssignmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): FraudCheckAssignmentDesk {
  return new FraudCheckAssignmentDesk(
    store,
    defaultFraudCheckAssignmentValidator(),
    clockValue,
    [],
    defaultFraudCheckAssignmentEngine(flagsValue),
  );
}
