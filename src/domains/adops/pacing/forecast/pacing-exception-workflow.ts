import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PacingExceptionEngine, defaultPacingExceptionEngine } from "./pacing-exception-engine.js";
import { PacingExceptionValidator, defaultPacingExceptionValidator } from "./pacing-exception-rules.js";
import { PacingExceptionStore } from "./pacing-exception-store.js";

/** Moves pacing exceptions through their life cycle and keeps a journal of what it did. */
export class PacingExceptionManager {
  store: PacingExceptionStore;
  validator: PacingExceptionValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PacingExceptionEngine;

  constructor(
    store: PacingExceptionStore,
    validator: PacingExceptionValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PacingExceptionEngine,
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
      throw new Error(`pacing exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pacing exception ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pacing exception ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newPacingExceptionManager(store: PacingExceptionStore, clockValue: clock.Clock, flagsValue: flags.Registry): PacingExceptionManager {
  return new PacingExceptionManager(
    store,
    defaultPacingExceptionValidator(),
    clockValue,
    [],
    defaultPacingExceptionEngine(flagsValue),
  );
}
