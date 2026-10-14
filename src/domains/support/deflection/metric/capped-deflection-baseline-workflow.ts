import * as clock from "../../../../kit/clock.js";
import {
  CappedDeflectionBaselineEngine,
  defaultCappedDeflectionBaselineEngine,
} from "./capped-deflection-baseline-engine.js";
import {
  CappedDeflectionBaselineValidator,
  defaultCappedDeflectionBaselineValidator,
} from "./capped-deflection-baseline-rules.js";
import { CappedDeflectionBaselineStore } from "./capped-deflection-baseline-store.js";

/** Moves capped deflection baselines through their life cycle and keeps a journal of what it did. */
export class CappedDeflectionBaselineDesk {
  store: CappedDeflectionBaselineStore;
  validator: CappedDeflectionBaselineValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CappedDeflectionBaselineEngine;

  constructor(
    store: CappedDeflectionBaselineStore,
    validator: CappedDeflectionBaselineValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CappedDeflectionBaselineEngine,
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
      throw new Error(`capped deflection baseline ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped deflection baseline ${code} not found`);
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
      throw new Error(`capped deflection baseline ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newCappedDeflectionBaselineDesk(store: CappedDeflectionBaselineStore, clockValue: clock.Clock): CappedDeflectionBaselineDesk {
  return new CappedDeflectionBaselineDesk(
    store,
    defaultCappedDeflectionBaselineValidator(),
    clockValue,
    [],
    defaultCappedDeflectionBaselineEngine(),
  );
}
