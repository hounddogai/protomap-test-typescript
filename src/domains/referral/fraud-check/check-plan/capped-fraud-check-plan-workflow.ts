import * as clock from "../../../../kit/clock.js";
import {
  CappedFraudCheckPlanValidator,
  defaultCappedFraudCheckPlanValidator,
} from "./capped-fraud-check-plan-rules.js";
import { CappedFraudCheckPlanStore } from "./capped-fraud-check-plan-store.js";

/** Moves capped fraud check plans through their life cycle and keeps a journal of what it did. */
export class CappedFraudCheckPlanManager {
  store: CappedFraudCheckPlanStore;
  validator: CappedFraudCheckPlanValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: CappedFraudCheckPlanStore,
    validator: CappedFraudCheckPlanValidator,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped fraud check plan ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped fraud check plan ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  reviewStale(cutoff: number): number {
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

export function newCappedFraudCheckPlanManager(store: CappedFraudCheckPlanStore, clockValue: clock.Clock): CappedFraudCheckPlanManager {
  return new CappedFraudCheckPlanManager(store, defaultCappedFraudCheckPlanValidator(), clockValue, []);
}
