import * as clock from "../../../../kit/clock.js";
import {
  RollingCohortMilestoneEngine,
  defaultRollingCohortMilestoneEngine,
} from "./rolling-cohort-milestone-engine.js";
import {
  RollingCohortMilestoneValidator,
  defaultRollingCohortMilestoneValidator,
} from "./rolling-cohort-milestone-rules.js";
import { RollingCohortMilestoneStore } from "./rolling-cohort-milestone-store.js";

/** Moves rolling cohort milestones through their life cycle and keeps a journal of what it did. */
export class RollingCohortMilestoneWorkflow {
  store: RollingCohortMilestoneStore;
  validator: RollingCohortMilestoneValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingCohortMilestoneEngine;

  constructor(
    store: RollingCohortMilestoneStore,
    validator: RollingCohortMilestoneValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingCohortMilestoneEngine,
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
      throw new Error(`rolling cohort milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling cohort milestone ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling cohort milestone ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newRollingCohortMilestoneWorkflow(store: RollingCohortMilestoneStore, clockValue: clock.Clock): RollingCohortMilestoneWorkflow {
  return new RollingCohortMilestoneWorkflow(
    store,
    defaultRollingCohortMilestoneValidator(),
    clockValue,
    [],
    defaultRollingCohortMilestoneEngine(),
  );
}
