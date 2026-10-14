import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { EnrollmentSlotEngine, defaultEnrollmentSlotEngine } from "./enrollment-slot-engine.js";
import { EnrollmentSlotValidator, defaultEnrollmentSlotValidator } from "./enrollment-slot-rules.js";
import { EnrollmentSlotStore } from "./enrollment-slot-store.js";

/** Moves enrollment slots through their life cycle and keeps a journal of what it did. */
export class EnrollmentSlotWorkflow {
  store: EnrollmentSlotStore;
  validator: EnrollmentSlotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: EnrollmentSlotEngine;

  constructor(
    store: EnrollmentSlotStore,
    validator: EnrollmentSlotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: EnrollmentSlotEngine,
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
      throw new Error(`enrollment slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`enrollment slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`enrollment slot ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newEnrollmentSlotWorkflow(store: EnrollmentSlotStore, clockValue: clock.Clock, flagsValue: flags.Registry): EnrollmentSlotWorkflow {
  return new EnrollmentSlotWorkflow(
    store,
    defaultEnrollmentSlotValidator(),
    clockValue,
    [],
    defaultEnrollmentSlotEngine(flagsValue),
  );
}
