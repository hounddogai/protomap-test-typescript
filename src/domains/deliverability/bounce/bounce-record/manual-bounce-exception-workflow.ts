import * as clock from "../../../../kit/clock.js";
import { ManualBounceExceptionEngine, defaultManualBounceExceptionEngine } from "./manual-bounce-exception-engine.js";
import {
  ManualBounceExceptionValidator,
  defaultManualBounceExceptionValidator,
} from "./manual-bounce-exception-rules.js";
import { ManualBounceExceptionStore } from "./manual-bounce-exception-store.js";

/** Moves manual bounce exceptions through their life cycle and keeps a journal of what it did. */
export class ManualBounceExceptionDesk {
  store: ManualBounceExceptionStore;
  validator: ManualBounceExceptionValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualBounceExceptionEngine;

  constructor(
    store: ManualBounceExceptionStore,
    validator: ManualBounceExceptionValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualBounceExceptionEngine,
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
      throw new Error(`manual bounce exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual bounce exception ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual bounce exception ${code} not found`);
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

export function newManualBounceExceptionDesk(store: ManualBounceExceptionStore, clockValue: clock.Clock): ManualBounceExceptionDesk {
  return new ManualBounceExceptionDesk(
    store,
    defaultManualBounceExceptionValidator(),
    clockValue,
    [],
    defaultManualBounceExceptionEngine(),
  );
}
