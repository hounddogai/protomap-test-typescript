import * as clock from "../../../../kit/clock.js";
import { PayoutVarianceEngine, defaultPayoutVarianceEngine } from "./payout-variance-engine.js";
import { PayoutVarianceValidator, defaultPayoutVarianceValidator } from "./payout-variance-rules.js";
import { PayoutVarianceStore } from "./payout-variance-store.js";

/** Moves payout variances through their life cycle and keeps a journal of what it did. */
export class PayoutVarianceService {
  store: PayoutVarianceStore;
  validator: PayoutVarianceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PayoutVarianceEngine;

  constructor(
    store: PayoutVarianceStore,
    validator: PayoutVarianceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PayoutVarianceEngine,
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
      throw new Error(`payout variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`payout variance ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`payout variance ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newPayoutVarianceService(store: PayoutVarianceStore, clockValue: clock.Clock): PayoutVarianceService {
  return new PayoutVarianceService(
    store,
    defaultPayoutVarianceValidator(),
    clockValue,
    [],
    defaultPayoutVarianceEngine(),
  );
}
