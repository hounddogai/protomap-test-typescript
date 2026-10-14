import * as clock from "../../../../kit/clock.js";
import { RollingPathMilestoneEngine, defaultRollingPathMilestoneEngine } from "./rolling-path-milestone-engine.js";
import {
  RollingPathMilestoneValidator,
  defaultRollingPathMilestoneValidator,
} from "./rolling-path-milestone-rules.js";
import { RollingPathMilestoneStore } from "./rolling-path-milestone-store.js";

/** Moves rolling path milestones through their life cycle and keeps a journal of what it did. */
export class RollingPathMilestoneService {
  store: RollingPathMilestoneStore;
  validator: RollingPathMilestoneValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingPathMilestoneEngine;

  constructor(
    store: RollingPathMilestoneStore,
    validator: RollingPathMilestoneValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingPathMilestoneEngine,
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
      throw new Error(`rolling path milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling path milestone ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling path milestone ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newRollingPathMilestoneService(store: RollingPathMilestoneStore, clockValue: clock.Clock): RollingPathMilestoneService {
  return new RollingPathMilestoneService(
    store,
    defaultRollingPathMilestoneValidator(),
    clockValue,
    [],
    defaultRollingPathMilestoneEngine(),
  );
}
