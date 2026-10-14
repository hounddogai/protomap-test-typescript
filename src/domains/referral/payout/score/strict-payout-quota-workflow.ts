import * as clock from "../../../../kit/clock.js";
import { StrictPayoutQuotaEngine, defaultStrictPayoutQuotaEngine } from "./strict-payout-quota-engine.js";
import { StrictPayoutQuotaValidator, defaultStrictPayoutQuotaValidator } from "./strict-payout-quota-rules.js";
import { StrictPayoutQuotaStore } from "./strict-payout-quota-store.js";

/** Moves strict payout quotas through their life cycle and keeps a journal of what it did. */
export class StrictPayoutQuotaService {
  store: StrictPayoutQuotaStore;
  validator: StrictPayoutQuotaValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictPayoutQuotaEngine;

  constructor(
    store: StrictPayoutQuotaStore,
    validator: StrictPayoutQuotaValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictPayoutQuotaEngine,
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
      throw new Error(`strict payout quota ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict payout quota ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict payout quota ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newStrictPayoutQuotaService(store: StrictPayoutQuotaStore, clockValue: clock.Clock): StrictPayoutQuotaService {
  return new StrictPayoutQuotaService(
    store,
    defaultStrictPayoutQuotaValidator(),
    clockValue,
    [],
    defaultStrictPayoutQuotaEngine(),
  );
}
