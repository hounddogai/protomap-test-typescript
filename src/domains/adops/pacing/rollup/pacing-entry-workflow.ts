import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PacingEntryEngine, defaultPacingEntryEngine } from "./pacing-entry-engine.js";
import { PacingEntryValidator, defaultPacingEntryValidator } from "./pacing-entry-rules.js";
import { PacingEntryStore } from "./pacing-entry-store.js";

/** Moves pacing entries through their life cycle and keeps a journal of what it did. */
export class PacingEntryService {
  store: PacingEntryStore;
  validator: PacingEntryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PacingEntryEngine;

  constructor(
    store: PacingEntryStore,
    validator: PacingEntryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PacingEntryEngine,
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
      throw new Error(`pacing entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pacing entry ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pacing entry ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newPacingEntryService(store: PacingEntryStore, clockValue: clock.Clock, flagsValue: flags.Registry): PacingEntryService {
  return new PacingEntryService(
    store,
    defaultPacingEntryValidator(),
    clockValue,
    [],
    defaultPacingEntryEngine(flagsValue),
  );
}
