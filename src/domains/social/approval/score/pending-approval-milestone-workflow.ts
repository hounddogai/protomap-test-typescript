import * as clock from "../../../../kit/clock.js";
import {
  PendingApprovalMilestoneEngine,
  defaultPendingApprovalMilestoneEngine,
} from "./pending-approval-milestone-engine.js";
import {
  PendingApprovalMilestoneValidator,
  defaultPendingApprovalMilestoneValidator,
} from "./pending-approval-milestone-rules.js";
import { PendingApprovalMilestoneStore } from "./pending-approval-milestone-store.js";

/** Moves pending approval milestones through their life cycle and keeps a journal of what it did. */
export class PendingApprovalMilestoneDesk {
  store: PendingApprovalMilestoneStore;
  validator: PendingApprovalMilestoneValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingApprovalMilestoneEngine;

  constructor(
    store: PendingApprovalMilestoneStore,
    validator: PendingApprovalMilestoneValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingApprovalMilestoneEngine,
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
      throw new Error(`pending approval milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending approval milestone ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending approval milestone ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPendingApprovalMilestoneDesk(store: PendingApprovalMilestoneStore, clockValue: clock.Clock): PendingApprovalMilestoneDesk {
  return new PendingApprovalMilestoneDesk(
    store,
    defaultPendingApprovalMilestoneValidator(),
    clockValue,
    [],
    defaultPendingApprovalMilestoneEngine(),
  );
}
