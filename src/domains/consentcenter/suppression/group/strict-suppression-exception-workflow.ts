import * as clock from "../../../../kit/clock.js";
import {
  StrictSuppressionExceptionEngine,
  defaultStrictSuppressionExceptionEngine,
} from "./strict-suppression-exception-engine.js";
import {
  StrictSuppressionExceptionValidator,
  defaultStrictSuppressionExceptionValidator,
} from "./strict-suppression-exception-rules.js";
import { StrictSuppressionExceptionStore } from "./strict-suppression-exception-store.js";

/** Moves strict suppression exceptions through their life cycle and keeps a journal of what it did. */
export class StrictSuppressionExceptionManager {
  store: StrictSuppressionExceptionStore;
  validator: StrictSuppressionExceptionValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictSuppressionExceptionEngine;

  constructor(
    store: StrictSuppressionExceptionStore,
    validator: StrictSuppressionExceptionValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictSuppressionExceptionEngine,
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
      throw new Error(`strict suppression exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict suppression exception ${code} not found`);
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
      throw new Error(`strict suppression exception ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newStrictSuppressionExceptionManager(store: StrictSuppressionExceptionStore, clockValue: clock.Clock): StrictSuppressionExceptionManager {
  return new StrictSuppressionExceptionManager(
    store,
    defaultStrictSuppressionExceptionValidator(),
    clockValue,
    [],
    defaultStrictSuppressionExceptionEngine(),
  );
}
