import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  StrictRedemptionWindowEngine,
  defaultStrictRedemptionWindowEngine,
} from "./strict-redemption-window-engine.js";
import {
  StrictRedemptionWindowValidator,
  defaultStrictRedemptionWindowValidator,
} from "./strict-redemption-window-rules.js";
import { StrictRedemptionWindowStore } from "./strict-redemption-window-store.js";

/** Moves strict redemption windows through their life cycle and keeps a journal of what it did. */
export class StrictRedemptionWindowManager {
  store: StrictRedemptionWindowStore;
  validator: StrictRedemptionWindowValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictRedemptionWindowEngine;

  constructor(
    store: StrictRedemptionWindowStore,
    validator: StrictRedemptionWindowValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictRedemptionWindowEngine,
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
      throw new Error(`strict redemption window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict redemption window ${code} not found`);
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
      throw new Error(`strict redemption window ${code} not found`);
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

export function newStrictRedemptionWindowManager(store: StrictRedemptionWindowStore, clockValue: clock.Clock, flagsValue: flags.Registry): StrictRedemptionWindowManager {
  return new StrictRedemptionWindowManager(
    store,
    defaultStrictRedemptionWindowValidator(),
    clockValue,
    [],
    defaultStrictRedemptionWindowEngine(flagsValue),
  );
}
