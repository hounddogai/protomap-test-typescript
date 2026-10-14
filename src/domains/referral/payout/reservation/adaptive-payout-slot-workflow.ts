import * as clock from "../../../../kit/clock.js";
import { AdaptivePayoutSlotEngine, defaultAdaptivePayoutSlotEngine } from "./adaptive-payout-slot-engine.js";
import { AdaptivePayoutSlotValidator, defaultAdaptivePayoutSlotValidator } from "./adaptive-payout-slot-rules.js";
import { AdaptivePayoutSlotStore } from "./adaptive-payout-slot-store.js";

/** Moves adaptive payout slots through their life cycle and keeps a journal of what it did. */
export class AdaptivePayoutSlotWorkflow {
  store: AdaptivePayoutSlotStore;
  validator: AdaptivePayoutSlotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptivePayoutSlotEngine;

  constructor(
    store: AdaptivePayoutSlotStore,
    validator: AdaptivePayoutSlotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptivePayoutSlotEngine,
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
      throw new Error(`adaptive payout slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive payout slot ${code} not found`);
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
      throw new Error(`adaptive payout slot ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newAdaptivePayoutSlotWorkflow(store: AdaptivePayoutSlotStore, clockValue: clock.Clock): AdaptivePayoutSlotWorkflow {
  return new AdaptivePayoutSlotWorkflow(
    store,
    defaultAdaptivePayoutSlotValidator(),
    clockValue,
    [],
    defaultAdaptivePayoutSlotEngine(),
  );
}
