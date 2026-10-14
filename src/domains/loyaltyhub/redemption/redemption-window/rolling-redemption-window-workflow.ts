import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  RollingRedemptionWindowEngine,
  defaultRollingRedemptionWindowEngine,
} from "./rolling-redemption-window-engine.js";
import {
  RollingRedemptionWindowValidator,
  defaultRollingRedemptionWindowValidator,
} from "./rolling-redemption-window-rules.js";
import { RollingRedemptionWindowStore } from "./rolling-redemption-window-store.js";

/** Moves rolling redemption windows through their life cycle and keeps a journal of what it did. */
export class RollingRedemptionWindowDesk {
  store: RollingRedemptionWindowStore;
  validator: RollingRedemptionWindowValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingRedemptionWindowEngine;

  constructor(
    store: RollingRedemptionWindowStore,
    validator: RollingRedemptionWindowValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingRedemptionWindowEngine,
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
      throw new Error(`rolling redemption window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling redemption window ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling redemption window ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRollingRedemptionWindowDesk(store: RollingRedemptionWindowStore, clockValue: clock.Clock, flagsValue: flags.Registry): RollingRedemptionWindowDesk {
  return new RollingRedemptionWindowDesk(
    store,
    defaultRollingRedemptionWindowValidator(),
    clockValue,
    [],
    defaultRollingRedemptionWindowEngine(flagsValue),
  );
}
