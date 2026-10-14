import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { OptOutAdjustmentEngine, defaultOptOutAdjustmentEngine } from "./opt-out-adjustment-engine.js";
import { OptOutAdjustmentValidator, defaultOptOutAdjustmentValidator } from "./opt-out-adjustment-rules.js";
import { OptOutAdjustmentStore } from "./opt-out-adjustment-store.js";

/** Moves opt out adjustments through their life cycle and keeps a journal of what it did. */
export class OptOutAdjustmentService {
  store: OptOutAdjustmentStore;
  validator: OptOutAdjustmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: OptOutAdjustmentEngine;

  constructor(
    store: OptOutAdjustmentStore,
    validator: OptOutAdjustmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: OptOutAdjustmentEngine,
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
      throw new Error(`opt out adjustment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`opt out adjustment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`opt out adjustment ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newOptOutAdjustmentService(store: OptOutAdjustmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): OptOutAdjustmentService {
  return new OptOutAdjustmentService(
    store,
    defaultOptOutAdjustmentValidator(),
    clockValue,
    [],
    defaultOptOutAdjustmentEngine(flagsValue),
  );
}
