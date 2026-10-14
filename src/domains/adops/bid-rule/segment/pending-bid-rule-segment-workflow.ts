import * as clock from "../../../../kit/clock.js";
import {
  PendingBidRuleSegmentEngine,
  defaultPendingBidRuleSegmentEngine,
} from "./pending-bid-rule-segment-engine.js";
import {
  PendingBidRuleSegmentValidator,
  defaultPendingBidRuleSegmentValidator,
} from "./pending-bid-rule-segment-rules.js";
import { PendingBidRuleSegmentStore } from "./pending-bid-rule-segment-store.js";

/** Moves pending bid rule segments through their life cycle and keeps a journal of what it did. */
export class PendingBidRuleSegmentWorkflow {
  store: PendingBidRuleSegmentStore;
  validator: PendingBidRuleSegmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingBidRuleSegmentEngine;

  constructor(
    store: PendingBidRuleSegmentStore,
    validator: PendingBidRuleSegmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingBidRuleSegmentEngine,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending bid rule segment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending bid rule segment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending bid rule segment ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newPendingBidRuleSegmentWorkflow(store: PendingBidRuleSegmentStore, clockValue: clock.Clock): PendingBidRuleSegmentWorkflow {
  return new PendingBidRuleSegmentWorkflow(
    store,
    defaultPendingBidRuleSegmentValidator(),
    clockValue,
    [],
    defaultPendingBidRuleSegmentEngine(),
  );
}
