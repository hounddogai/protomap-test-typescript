import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PacingTargetEngine, defaultPacingTargetEngine } from "./pacing-target-engine.js";
import { PacingTargetValidator, defaultPacingTargetValidator } from "./pacing-target-rules.js";
import { PacingTargetStore } from "./pacing-target-store.js";

/** Moves pacing targets through their life cycle and keeps a journal of what it did. */
export class PacingTargetDesk {
  store: PacingTargetStore;
  validator: PacingTargetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PacingTargetEngine;

  constructor(
    store: PacingTargetStore,
    validator: PacingTargetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PacingTargetEngine,
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
      throw new Error(`pacing target ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pacing target ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pacing target ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPacingTargetDesk(store: PacingTargetStore, clockValue: clock.Clock, flagsValue: flags.Registry): PacingTargetDesk {
  return new PacingTargetDesk(
    store,
    defaultPacingTargetValidator(),
    clockValue,
    [],
    defaultPacingTargetEngine(flagsValue),
  );
}
