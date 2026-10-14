import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  LenientReputationAssignmentEngine,
  defaultLenientReputationAssignmentEngine,
} from "./lenient-reputation-assignment-engine.js";
import {
  LenientReputationAssignmentValidator,
  defaultLenientReputationAssignmentValidator,
} from "./lenient-reputation-assignment-rules.js";
import { LenientReputationAssignmentStore } from "./lenient-reputation-assignment-store.js";

/** Moves lenient reputation assignments through their life cycle and keeps a journal of what it did. */
export class LenientReputationAssignmentDesk {
  store: LenientReputationAssignmentStore;
  validator: LenientReputationAssignmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientReputationAssignmentEngine;

  constructor(
    store: LenientReputationAssignmentStore,
    validator: LenientReputationAssignmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientReputationAssignmentEngine,
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
      throw new Error(`lenient reputation assignment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient reputation assignment ${code} not found`);
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
      throw new Error(`lenient reputation assignment ${code} not found`);
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

export function newLenientReputationAssignmentDesk(store: LenientReputationAssignmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): LenientReputationAssignmentDesk {
  return new LenientReputationAssignmentDesk(
    store,
    defaultLenientReputationAssignmentValidator(),
    clockValue,
    [],
    defaultLenientReputationAssignmentEngine(flagsValue),
  );
}
