import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CappedEnrollmentCycleEngine, defaultCappedEnrollmentCycleEngine } from "./capped-enrollment-cycle-engine.js";
import {
  CappedEnrollmentCycleValidator,
  defaultCappedEnrollmentCycleValidator,
} from "./capped-enrollment-cycle-rules.js";
import { CappedEnrollmentCycleStore } from "./capped-enrollment-cycle-store.js";

/** Moves capped enrollment cycles through their life cycle and keeps a journal of what it did. */
export class CappedEnrollmentCycleWorkflow {
  store: CappedEnrollmentCycleStore;
  validator: CappedEnrollmentCycleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CappedEnrollmentCycleEngine;

  constructor(
    store: CappedEnrollmentCycleStore,
    validator: CappedEnrollmentCycleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CappedEnrollmentCycleEngine,
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
      throw new Error(`capped enrollment cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped enrollment cycle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped enrollment cycle ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newCappedEnrollmentCycleWorkflow(store: CappedEnrollmentCycleStore, clockValue: clock.Clock, flagsValue: flags.Registry): CappedEnrollmentCycleWorkflow {
  return new CappedEnrollmentCycleWorkflow(
    store,
    defaultCappedEnrollmentCycleValidator(),
    clockValue,
    [],
    defaultCappedEnrollmentCycleEngine(flagsValue),
  );
}
