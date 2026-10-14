import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { LenientEnrollmentSlotEngine, defaultLenientEnrollmentSlotEngine } from "./lenient-enrollment-slot-engine.js";
import {
  LenientEnrollmentSlotValidator,
  defaultLenientEnrollmentSlotValidator,
} from "./lenient-enrollment-slot-rules.js";
import { LenientEnrollmentSlotStore } from "./lenient-enrollment-slot-store.js";

/** Moves lenient enrollment slots through their life cycle and keeps a journal of what it did. */
export class LenientEnrollmentSlotCoordinator {
  store: LenientEnrollmentSlotStore;
  validator: LenientEnrollmentSlotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientEnrollmentSlotEngine;

  constructor(
    store: LenientEnrollmentSlotStore,
    validator: LenientEnrollmentSlotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientEnrollmentSlotEngine,
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
      throw new Error(`lenient enrollment slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient enrollment slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient enrollment slot ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newLenientEnrollmentSlotCoordinator(store: LenientEnrollmentSlotStore, clockValue: clock.Clock, flagsValue: flags.Registry): LenientEnrollmentSlotCoordinator {
  return new LenientEnrollmentSlotCoordinator(
    store,
    defaultLenientEnrollmentSlotValidator(),
    clockValue,
    [],
    defaultLenientEnrollmentSlotEngine(flagsValue),
  );
}
