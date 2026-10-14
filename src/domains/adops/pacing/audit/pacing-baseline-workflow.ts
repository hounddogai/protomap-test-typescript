import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PacingBaselineEngine, defaultPacingBaselineEngine } from "./pacing-baseline-engine.js";
import { PacingBaselineValidator, defaultPacingBaselineValidator } from "./pacing-baseline-rules.js";
import { PacingBaselineStore } from "./pacing-baseline-store.js";

/** Moves pacing baselines through their life cycle and keeps a journal of what it did. */
export class PacingBaselineWorkflow {
  store: PacingBaselineStore;
  validator: PacingBaselineValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PacingBaselineEngine;

  constructor(
    store: PacingBaselineStore,
    validator: PacingBaselineValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PacingBaselineEngine,
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
      throw new Error(`pacing baseline ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pacing baseline ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pacing baseline ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newPacingBaselineWorkflow(store: PacingBaselineStore, clockValue: clock.Clock, flagsValue: flags.Registry): PacingBaselineWorkflow {
  return new PacingBaselineWorkflow(
    store,
    defaultPacingBaselineValidator(),
    clockValue,
    [],
    defaultPacingBaselineEngine(flagsValue),
  );
}
