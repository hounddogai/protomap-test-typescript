import * as clock from "../../../../kit/clock.js";
import {
  RollingFraudCheckTierValidator,
  defaultRollingFraudCheckTierValidator,
} from "./rolling-fraud-check-tier-rules.js";
import { RollingFraudCheckTierStore } from "./rolling-fraud-check-tier-store.js";

/** Moves rolling fraud check tiers through their life cycle and keeps a journal of what it did. */
export class RollingFraudCheckTierService {
  store: RollingFraudCheckTierStore;
  validator: RollingFraudCheckTierValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RollingFraudCheckTierStore,
    validator: RollingFraudCheckTierValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling fraud check tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling fraud check tier ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  audit(cutoff: number): number {
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

export function newRollingFraudCheckTierService(store: RollingFraudCheckTierStore, clockValue: clock.Clock): RollingFraudCheckTierService {
  return new RollingFraudCheckTierService(store, defaultRollingFraudCheckTierValidator(), clockValue, []);
}
