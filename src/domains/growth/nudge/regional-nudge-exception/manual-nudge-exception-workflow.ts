import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ManualNudgeExceptionEngine, defaultManualNudgeExceptionEngine } from "./manual-nudge-exception-engine.js";
import {
  ManualNudgeExceptionValidator,
  defaultManualNudgeExceptionValidator,
} from "./manual-nudge-exception-rules.js";
import { ManualNudgeExceptionStore } from "./manual-nudge-exception-store.js";

/** Moves manual nudge exceptions through their life cycle and keeps a journal of what it did. */
export class ManualNudgeExceptionManager {
  store: ManualNudgeExceptionStore;
  validator: ManualNudgeExceptionValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualNudgeExceptionEngine;

  constructor(
    store: ManualNudgeExceptionStore,
    validator: ManualNudgeExceptionValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualNudgeExceptionEngine,
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
      throw new Error(`manual nudge exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual nudge exception ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual nudge exception ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newManualNudgeExceptionManager(store: ManualNudgeExceptionStore, clockValue: clock.Clock, flagsValue: flags.Registry): ManualNudgeExceptionManager {
  return new ManualNudgeExceptionManager(
    store,
    defaultManualNudgeExceptionValidator(),
    clockValue,
    [],
    defaultManualNudgeExceptionEngine(flagsValue),
  );
}
