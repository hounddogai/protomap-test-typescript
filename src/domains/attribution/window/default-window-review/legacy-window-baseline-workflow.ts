import * as clock from "../../../../kit/clock.js";
import { LegacyWindowBaselineEngine, defaultLegacyWindowBaselineEngine } from "./legacy-window-baseline-engine.js";
import {
  LegacyWindowBaselineValidator,
  defaultLegacyWindowBaselineValidator,
} from "./legacy-window-baseline-rules.js";
import { LegacyWindowBaselineStore } from "./legacy-window-baseline-store.js";

/** Moves legacy window baselines through their life cycle and keeps a journal of what it did. */
export class LegacyWindowBaselineDesk {
  store: LegacyWindowBaselineStore;
  validator: LegacyWindowBaselineValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyWindowBaselineEngine;

  constructor(
    store: LegacyWindowBaselineStore,
    validator: LegacyWindowBaselineValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyWindowBaselineEngine,
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
      throw new Error(`legacy window baseline ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy window baseline ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy window baseline ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newLegacyWindowBaselineDesk(store: LegacyWindowBaselineStore, clockValue: clock.Clock): LegacyWindowBaselineDesk {
  return new LegacyWindowBaselineDesk(
    store,
    defaultLegacyWindowBaselineValidator(),
    clockValue,
    [],
    defaultLegacyWindowBaselineEngine(),
  );
}
