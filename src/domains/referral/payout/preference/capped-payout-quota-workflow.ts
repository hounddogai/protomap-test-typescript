import * as clock from "../../../../kit/clock.js";
import { CappedPayoutQuotaEngine, defaultCappedPayoutQuotaEngine } from "./capped-payout-quota-engine.js";
import { CappedPayoutQuotaValidator, defaultCappedPayoutQuotaValidator } from "./capped-payout-quota-rules.js";
import { CappedPayoutQuotaStore } from "./capped-payout-quota-store.js";

/** Moves capped payout quotas through their life cycle and keeps a journal of what it did. */
export class CappedPayoutQuotaWorkflow {
  store: CappedPayoutQuotaStore;
  validator: CappedPayoutQuotaValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CappedPayoutQuotaEngine;

  constructor(
    store: CappedPayoutQuotaStore,
    validator: CappedPayoutQuotaValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CappedPayoutQuotaEngine,
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
      throw new Error(`capped payout quota ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped payout quota ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped payout quota ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newCappedPayoutQuotaWorkflow(store: CappedPayoutQuotaStore, clockValue: clock.Clock): CappedPayoutQuotaWorkflow {
  return new CappedPayoutQuotaWorkflow(
    store,
    defaultCappedPayoutQuotaValidator(),
    clockValue,
    [],
    defaultCappedPayoutQuotaEngine(),
  );
}
