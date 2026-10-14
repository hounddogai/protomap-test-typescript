import * as clock from "../../../../kit/clock.js";
import { ExitRuleMilestoneEngine, defaultExitRuleMilestoneEngine } from "./exit-rule-milestone-engine.js";
import { ExitRuleMilestoneValidator, defaultExitRuleMilestoneValidator } from "./exit-rule-milestone-rules.js";
import { ExitRuleMilestoneStore } from "./exit-rule-milestone-store.js";

/** Moves exit rule milestones through their life cycle and keeps a journal of what it did. */
export class ExitRuleMilestoneCoordinator {
  store: ExitRuleMilestoneStore;
  validator: ExitRuleMilestoneValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ExitRuleMilestoneEngine;

  constructor(
    store: ExitRuleMilestoneStore,
    validator: ExitRuleMilestoneValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ExitRuleMilestoneEngine,
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
      throw new Error(`exit rule milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`exit rule milestone ${code} not found`);
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
      throw new Error(`exit rule milestone ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newExitRuleMilestoneCoordinator(store: ExitRuleMilestoneStore, clockValue: clock.Clock): ExitRuleMilestoneCoordinator {
  return new ExitRuleMilestoneCoordinator(
    store,
    defaultExitRuleMilestoneValidator(),
    clockValue,
    [],
    defaultExitRuleMilestoneEngine(),
  );
}
