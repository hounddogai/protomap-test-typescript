import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  FallbackApprovalMilestoneEngine,
  defaultFallbackApprovalMilestoneEngine,
} from "./fallback-approval-milestone-engine.js";
import {
  FallbackApprovalMilestoneValidator,
  defaultFallbackApprovalMilestoneValidator,
} from "./fallback-approval-milestone-rules.js";
import { FallbackApprovalMilestoneStore } from "./fallback-approval-milestone-store.js";

/** Moves fallback approval milestones through their life cycle and keeps a journal of what it did. */
export class FallbackApprovalMilestoneWorkflow {
  store: FallbackApprovalMilestoneStore;
  validator: FallbackApprovalMilestoneValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackApprovalMilestoneEngine;

  constructor(
    store: FallbackApprovalMilestoneStore,
    validator: FallbackApprovalMilestoneValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackApprovalMilestoneEngine,
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
      throw new Error(`fallback approval milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback approval milestone ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback approval milestone ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newFallbackApprovalMilestoneWorkflow(store: FallbackApprovalMilestoneStore, clockValue: clock.Clock, flagsValue: flags.Registry): FallbackApprovalMilestoneWorkflow {
  return new FallbackApprovalMilestoneWorkflow(
    store,
    defaultFallbackApprovalMilestoneValidator(),
    clockValue,
    [],
    defaultFallbackApprovalMilestoneEngine(flagsValue),
  );
}
