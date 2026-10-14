import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PrimaryWaitMilestoneEngine, defaultPrimaryWaitMilestoneEngine } from "./primary-wait-milestone-engine.js";
import {
  PrimaryWaitMilestoneValidator,
  defaultPrimaryWaitMilestoneValidator,
} from "./primary-wait-milestone-rules.js";
import { PrimaryWaitMilestoneStore } from "./primary-wait-milestone-store.js";

/** Moves primary wait milestones through their life cycle and keeps a journal of what it did. */
export class PrimaryWaitMilestoneCoordinator {
  store: PrimaryWaitMilestoneStore;
  validator: PrimaryWaitMilestoneValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryWaitMilestoneEngine;

  constructor(
    store: PrimaryWaitMilestoneStore,
    validator: PrimaryWaitMilestoneValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryWaitMilestoneEngine,
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
      throw new Error(`primary wait milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary wait milestone ${code} not found`);
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
      throw new Error(`primary wait milestone ${code} not found`);
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

export function newPrimaryWaitMilestoneCoordinator(store: PrimaryWaitMilestoneStore, clockValue: clock.Clock, flagsValue: flags.Registry): PrimaryWaitMilestoneCoordinator {
  return new PrimaryWaitMilestoneCoordinator(
    store,
    defaultPrimaryWaitMilestoneValidator(),
    clockValue,
    [],
    defaultPrimaryWaitMilestoneEngine(flagsValue),
  );
}
