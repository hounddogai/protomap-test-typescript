import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RollingPayoutBatchEngine, defaultRollingPayoutBatchEngine } from "./rolling-payout-batch-engine.js";
import { RollingPayoutBatchValidator, defaultRollingPayoutBatchValidator } from "./rolling-payout-batch-rules.js";
import { RollingPayoutBatchStore } from "./rolling-payout-batch-store.js";

/** Moves rolling payout batches through their life cycle and keeps a journal of what it did. */
export class RollingPayoutBatchWorkflow {
  store: RollingPayoutBatchStore;
  validator: RollingPayoutBatchValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingPayoutBatchEngine;

  constructor(
    store: RollingPayoutBatchStore,
    validator: RollingPayoutBatchValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingPayoutBatchEngine,
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
      throw new Error(`rolling payout batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling payout batch ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling payout batch ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newRollingPayoutBatchWorkflow(store: RollingPayoutBatchStore, clockValue: clock.Clock, flagsValue: flags.Registry): RollingPayoutBatchWorkflow {
  return new RollingPayoutBatchWorkflow(
    store,
    defaultRollingPayoutBatchValidator(),
    clockValue,
    [],
    defaultRollingPayoutBatchEngine(flagsValue),
  );
}
