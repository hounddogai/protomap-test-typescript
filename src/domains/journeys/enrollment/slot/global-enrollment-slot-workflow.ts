import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { GlobalEnrollmentSlotEngine, defaultGlobalEnrollmentSlotEngine } from "./global-enrollment-slot-engine.js";
import {
  GlobalEnrollmentSlotValidator,
  defaultGlobalEnrollmentSlotValidator,
} from "./global-enrollment-slot-rules.js";
import { GlobalEnrollmentSlotStore } from "./global-enrollment-slot-store.js";

/** Moves global enrollment slots through their life cycle and keeps a journal of what it did. */
export class GlobalEnrollmentSlotService {
  store: GlobalEnrollmentSlotStore;
  validator: GlobalEnrollmentSlotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalEnrollmentSlotEngine;

  constructor(
    store: GlobalEnrollmentSlotStore,
    validator: GlobalEnrollmentSlotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalEnrollmentSlotEngine,
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
      throw new Error(`global enrollment slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global enrollment slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global enrollment slot ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newGlobalEnrollmentSlotService(store: GlobalEnrollmentSlotStore, clockValue: clock.Clock, flagsValue: flags.Registry): GlobalEnrollmentSlotService {
  return new GlobalEnrollmentSlotService(
    store,
    defaultGlobalEnrollmentSlotValidator(),
    clockValue,
    [],
    defaultGlobalEnrollmentSlotEngine(flagsValue),
  );
}
