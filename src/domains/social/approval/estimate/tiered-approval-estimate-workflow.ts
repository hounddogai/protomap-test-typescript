import * as clock from "../../../../kit/clock.js";
import {
  TieredApprovalEstimateValidator,
  defaultTieredApprovalEstimateValidator,
} from "./tiered-approval-estimate-rules.js";
import { TieredApprovalEstimateStore } from "./tiered-approval-estimate-store.js";

/** Moves tiered approval estimates through their life cycle and keeps a journal of what it did. */
export class TieredApprovalEstimateDesk {
  store: TieredApprovalEstimateStore;
  validator: TieredApprovalEstimateValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: TieredApprovalEstimateStore,
    validator: TieredApprovalEstimateValidator,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered approval estimate ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered approval estimate ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
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

export function newTieredApprovalEstimateDesk(store: TieredApprovalEstimateStore, clockValue: clock.Clock): TieredApprovalEstimateDesk {
  return new TieredApprovalEstimateDesk(store, defaultTieredApprovalEstimateValidator(), clockValue, []);
}
