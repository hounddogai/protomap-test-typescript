import * as clock from "../../../../kit/clock.js";
import { ApprovalSegmentEngine, defaultApprovalSegmentEngine } from "./approval-segment-engine.js";
import { ApprovalSegmentValidator, defaultApprovalSegmentValidator } from "./approval-segment-rules.js";
import { ApprovalSegmentStore } from "./approval-segment-store.js";

/** Moves approval segments through their life cycle and keeps a journal of what it did. */
export class ApprovalSegmentCoordinator {
  store: ApprovalSegmentStore;
  validator: ApprovalSegmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ApprovalSegmentEngine;

  constructor(
    store: ApprovalSegmentStore,
    validator: ApprovalSegmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ApprovalSegmentEngine,
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
      throw new Error(`approval segment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`approval segment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`approval segment ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newApprovalSegmentCoordinator(store: ApprovalSegmentStore, clockValue: clock.Clock): ApprovalSegmentCoordinator {
  return new ApprovalSegmentCoordinator(
    store,
    defaultApprovalSegmentValidator(),
    clockValue,
    [],
    defaultApprovalSegmentEngine(),
  );
}
