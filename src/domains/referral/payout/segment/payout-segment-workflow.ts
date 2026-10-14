import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PayoutSegmentEngine, defaultPayoutSegmentEngine } from "./payout-segment-engine.js";
import { PayoutSegmentValidator, defaultPayoutSegmentValidator } from "./payout-segment-rules.js";
import { PayoutSegmentStore } from "./payout-segment-store.js";

/** Moves payout segments through their life cycle and keeps a journal of what it did. */
export class PayoutSegmentWorkflow {
  store: PayoutSegmentStore;
  validator: PayoutSegmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PayoutSegmentEngine;

  constructor(
    store: PayoutSegmentStore,
    validator: PayoutSegmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PayoutSegmentEngine,
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
      throw new Error(`payout segment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`payout segment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`payout segment ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newPayoutSegmentWorkflow(store: PayoutSegmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): PayoutSegmentWorkflow {
  return new PayoutSegmentWorkflow(
    store,
    defaultPayoutSegmentValidator(),
    clockValue,
    [],
    defaultPayoutSegmentEngine(flagsValue),
  );
}
