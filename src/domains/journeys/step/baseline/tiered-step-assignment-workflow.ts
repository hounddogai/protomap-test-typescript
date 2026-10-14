import * as clock from "../../../../kit/clock.js";
import {
  TieredStepAssignmentValidator,
  defaultTieredStepAssignmentValidator,
} from "./tiered-step-assignment-rules.js";
import { TieredStepAssignmentStore } from "./tiered-step-assignment-store.js";

/** Moves tiered step assignments through their life cycle and keeps a journal of what it did. */
export class TieredStepAssignmentCoordinator {
  store: TieredStepAssignmentStore;
  validator: TieredStepAssignmentValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: TieredStepAssignmentStore,
    validator: TieredStepAssignmentValidator,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered step assignment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered step assignment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
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

export function newTieredStepAssignmentCoordinator(store: TieredStepAssignmentStore, clockValue: clock.Clock): TieredStepAssignmentCoordinator {
  return new TieredStepAssignmentCoordinator(store, defaultTieredStepAssignmentValidator(), clockValue, []);
}
