import * as clock from "../../../../kit/clock.js";
import {
  PendingFraudCheckRuleValidator,
  defaultPendingFraudCheckRuleValidator,
} from "./pending-fraud-check-rule-rules.js";
import { PendingFraudCheckRuleStore } from "./pending-fraud-check-rule-store.js";

/** Moves pending fraud check rules through their life cycle and keeps a journal of what it did. */
export class PendingFraudCheckRuleManager {
  store: PendingFraudCheckRuleStore;
  validator: PendingFraudCheckRuleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PendingFraudCheckRuleStore,
    validator: PendingFraudCheckRuleValidator,
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
      throw new Error(`pending fraud check rule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending fraud check rule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newPendingFraudCheckRuleManager(store: PendingFraudCheckRuleStore, clockValue: clock.Clock): PendingFraudCheckRuleManager {
  return new PendingFraudCheckRuleManager(store, defaultPendingFraudCheckRuleValidator(), clockValue, []);
}
