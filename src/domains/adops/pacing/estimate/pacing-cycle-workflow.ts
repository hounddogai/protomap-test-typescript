import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PacingCycleEngine, defaultPacingCycleEngine } from "./pacing-cycle-engine.js";
import { PacingCycleValidator, defaultPacingCycleValidator } from "./pacing-cycle-rules.js";
import { PacingCycleStore } from "./pacing-cycle-store.js";

/** Moves pacing cycles through their life cycle and keeps a journal of what it did. */
export class PacingCycleService {
  store: PacingCycleStore;
  validator: PacingCycleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PacingCycleEngine;

  constructor(
    store: PacingCycleStore,
    validator: PacingCycleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PacingCycleEngine,
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
      throw new Error(`pacing cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pacing cycle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pacing cycle ${code} not found`);
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

export function newPacingCycleService(store: PacingCycleStore, clockValue: clock.Clock, flagsValue: flags.Registry): PacingCycleService {
  return new PacingCycleService(
    store,
    defaultPacingCycleValidator(),
    clockValue,
    [],
    defaultPacingCycleEngine(flagsValue),
  );
}
