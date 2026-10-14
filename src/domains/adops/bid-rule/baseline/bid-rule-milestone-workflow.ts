import * as clock from "../../../../kit/clock.js";
import { BidRuleMilestoneEngine, defaultBidRuleMilestoneEngine } from "./bid-rule-milestone-engine.js";
import { BidRuleMilestoneValidator, defaultBidRuleMilestoneValidator } from "./bid-rule-milestone-rules.js";
import { BidRuleMilestoneStore } from "./bid-rule-milestone-store.js";

/** Moves bid rule milestones through their life cycle and keeps a journal of what it did. */
export class BidRuleMilestoneDesk {
  store: BidRuleMilestoneStore;
  validator: BidRuleMilestoneValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BidRuleMilestoneEngine;

  constructor(
    store: BidRuleMilestoneStore,
    validator: BidRuleMilestoneValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BidRuleMilestoneEngine,
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
      throw new Error(`bid rule milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bid rule milestone ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bid rule milestone ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newBidRuleMilestoneDesk(store: BidRuleMilestoneStore, clockValue: clock.Clock): BidRuleMilestoneDesk {
  return new BidRuleMilestoneDesk(
    store,
    defaultBidRuleMilestoneValidator(),
    clockValue,
    [],
    defaultBidRuleMilestoneEngine(),
  );
}
