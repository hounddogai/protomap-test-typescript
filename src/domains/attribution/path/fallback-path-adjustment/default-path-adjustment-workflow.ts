import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { DefaultPathAdjustmentEngine, defaultDefaultPathAdjustmentEngine } from "./default-path-adjustment-engine.js";
import {
  DefaultPathAdjustmentValidator,
  defaultDefaultPathAdjustmentValidator,
} from "./default-path-adjustment-rules.js";
import { DefaultPathAdjustmentStore } from "./default-path-adjustment-store.js";

/** Moves default path adjustments through their life cycle and keeps a journal of what it did. */
export class DefaultPathAdjustmentDesk {
  store: DefaultPathAdjustmentStore;
  validator: DefaultPathAdjustmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultPathAdjustmentEngine;

  constructor(
    store: DefaultPathAdjustmentStore,
    validator: DefaultPathAdjustmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultPathAdjustmentEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default path adjustment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default path adjustment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default path adjustment ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newDefaultPathAdjustmentDesk(store: DefaultPathAdjustmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): DefaultPathAdjustmentDesk {
  return new DefaultPathAdjustmentDesk(
    store,
    defaultDefaultPathAdjustmentValidator(),
    clockValue,
    [],
    defaultDefaultPathAdjustmentEngine(flagsValue),
  );
}
