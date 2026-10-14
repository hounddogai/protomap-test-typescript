import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  PrimaryCohortAdjustmentEngine,
  defaultPrimaryCohortAdjustmentEngine,
} from "./primary-cohort-adjustment-engine.js";
import {
  PrimaryCohortAdjustmentValidator,
  defaultPrimaryCohortAdjustmentValidator,
} from "./primary-cohort-adjustment-rules.js";
import { PrimaryCohortAdjustmentStore } from "./primary-cohort-adjustment-store.js";

/** Moves primary cohort adjustments through their life cycle and keeps a journal of what it did. */
export class PrimaryCohortAdjustmentDesk {
  store: PrimaryCohortAdjustmentStore;
  validator: PrimaryCohortAdjustmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryCohortAdjustmentEngine;

  constructor(
    store: PrimaryCohortAdjustmentStore,
    validator: PrimaryCohortAdjustmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryCohortAdjustmentEngine,
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
      throw new Error(`primary cohort adjustment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary cohort adjustment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary cohort adjustment ${code} not found`);
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

export function newPrimaryCohortAdjustmentDesk(store: PrimaryCohortAdjustmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): PrimaryCohortAdjustmentDesk {
  return new PrimaryCohortAdjustmentDesk(
    store,
    defaultPrimaryCohortAdjustmentValidator(),
    clockValue,
    [],
    defaultPrimaryCohortAdjustmentEngine(flagsValue),
  );
}
