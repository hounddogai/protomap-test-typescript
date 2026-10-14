import * as clock from "../../../../kit/clock.js";
import {
  AdaptiveDoubleOptInSlotEngine,
  defaultAdaptiveDoubleOptInSlotEngine,
} from "./adaptive-double-opt-in-slot-engine.js";
import {
  AdaptiveDoubleOptInSlotValidator,
  defaultAdaptiveDoubleOptInSlotValidator,
} from "./adaptive-double-opt-in-slot-rules.js";
import { AdaptiveDoubleOptInSlotStore } from "./adaptive-double-opt-in-slot-store.js";

/** Moves adaptive double opt in slots through their life cycle and keeps a journal of what it did. */
export class AdaptiveDoubleOptInSlotCoordinator {
  store: AdaptiveDoubleOptInSlotStore;
  validator: AdaptiveDoubleOptInSlotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveDoubleOptInSlotEngine;

  constructor(
    store: AdaptiveDoubleOptInSlotStore,
    validator: AdaptiveDoubleOptInSlotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveDoubleOptInSlotEngine,
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
      throw new Error(`adaptive double opt in slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive double opt in slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive double opt in slot ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newAdaptiveDoubleOptInSlotCoordinator(store: AdaptiveDoubleOptInSlotStore, clockValue: clock.Clock): AdaptiveDoubleOptInSlotCoordinator {
  return new AdaptiveDoubleOptInSlotCoordinator(
    store,
    defaultAdaptiveDoubleOptInSlotValidator(),
    clockValue,
    [],
    defaultAdaptiveDoubleOptInSlotEngine(),
  );
}
