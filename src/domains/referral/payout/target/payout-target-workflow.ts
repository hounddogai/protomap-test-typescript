import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PayoutTargetEngine, defaultPayoutTargetEngine } from "./payout-target-engine.js";
import { PayoutTargetValidator, defaultPayoutTargetValidator } from "./payout-target-rules.js";
import { PayoutTargetStore } from "./payout-target-store.js";

/** Moves payout targets through their life cycle and keeps a journal of what it did. */
export class PayoutTargetWorkflow {
  store: PayoutTargetStore;
  validator: PayoutTargetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PayoutTargetEngine;

  constructor(
    store: PayoutTargetStore,
    validator: PayoutTargetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PayoutTargetEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`payout target ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`payout target ${code} not found`);
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
      throw new Error(`payout target ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPayoutTargetWorkflow(store: PayoutTargetStore, clockValue: clock.Clock, flagsValue: flags.Registry): PayoutTargetWorkflow {
  return new PayoutTargetWorkflow(
    store,
    defaultPayoutTargetValidator(),
    clockValue,
    [],
    defaultPayoutTargetEngine(flagsValue),
  );
}
