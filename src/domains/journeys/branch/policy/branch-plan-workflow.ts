import * as clock from "../../../../kit/clock.js";
import { BranchPlanEngine, defaultBranchPlanEngine } from "./branch-plan-engine.js";
import { BranchPlanValidator, defaultBranchPlanValidator } from "./branch-plan-rules.js";
import { BranchPlanStore } from "./branch-plan-store.js";

/** Moves branch plans through their life cycle and keeps a journal of what it did. */
export class BranchPlanCoordinator {
  store: BranchPlanStore;
  validator: BranchPlanValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BranchPlanEngine;

  constructor(
    store: BranchPlanStore,
    validator: BranchPlanValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BranchPlanEngine,
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
      throw new Error(`branch plan ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`branch plan ${code} not found`);
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
      throw new Error(`branch plan ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newBranchPlanCoordinator(store: BranchPlanStore, clockValue: clock.Clock): BranchPlanCoordinator {
  return new BranchPlanCoordinator(store, defaultBranchPlanValidator(), clockValue, [], defaultBranchPlanEngine());
}
