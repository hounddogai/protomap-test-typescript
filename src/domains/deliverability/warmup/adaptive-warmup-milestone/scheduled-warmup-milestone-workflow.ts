import * as clock from "../../../../kit/clock.js";
import {
  ScheduledWarmupMilestoneEngine,
  defaultScheduledWarmupMilestoneEngine,
} from "./scheduled-warmup-milestone-engine.js";
import {
  ScheduledWarmupMilestoneValidator,
  defaultScheduledWarmupMilestoneValidator,
} from "./scheduled-warmup-milestone-rules.js";
import { ScheduledWarmupMilestoneStore } from "./scheduled-warmup-milestone-store.js";

/** Moves scheduled warmup milestones through their life cycle and keeps a journal of what it did. */
export class ScheduledWarmupMilestoneCoordinator {
  store: ScheduledWarmupMilestoneStore;
  validator: ScheduledWarmupMilestoneValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledWarmupMilestoneEngine;

  constructor(
    store: ScheduledWarmupMilestoneStore,
    validator: ScheduledWarmupMilestoneValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledWarmupMilestoneEngine,
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
      throw new Error(`scheduled warmup milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled warmup milestone ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled warmup milestone ${code} not found`);
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

export function newScheduledWarmupMilestoneCoordinator(store: ScheduledWarmupMilestoneStore, clockValue: clock.Clock): ScheduledWarmupMilestoneCoordinator {
  return new ScheduledWarmupMilestoneCoordinator(
    store,
    defaultScheduledWarmupMilestoneValidator(),
    clockValue,
    [],
    defaultScheduledWarmupMilestoneEngine(),
  );
}
