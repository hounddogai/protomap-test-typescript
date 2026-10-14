import * as clock from "../../../../kit/clock.js";
import {
  StrictPreferenceMilestoneEngine,
  defaultStrictPreferenceMilestoneEngine,
} from "./strict-preference-milestone-engine.js";
import {
  StrictPreferenceMilestoneValidator,
  defaultStrictPreferenceMilestoneValidator,
} from "./strict-preference-milestone-rules.js";
import { StrictPreferenceMilestoneStore } from "./strict-preference-milestone-store.js";

/** Moves strict preference milestones through their life cycle and keeps a journal of what it did. */
export class StrictPreferenceMilestoneCoordinator {
  store: StrictPreferenceMilestoneStore;
  validator: StrictPreferenceMilestoneValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictPreferenceMilestoneEngine;

  constructor(
    store: StrictPreferenceMilestoneStore,
    validator: StrictPreferenceMilestoneValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictPreferenceMilestoneEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict preference milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict preference milestone ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict preference milestone ${code} not found`);
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

export function newStrictPreferenceMilestoneCoordinator(store: StrictPreferenceMilestoneStore, clockValue: clock.Clock): StrictPreferenceMilestoneCoordinator {
  return new StrictPreferenceMilestoneCoordinator(
    store,
    defaultStrictPreferenceMilestoneValidator(),
    clockValue,
    [],
    defaultStrictPreferenceMilestoneEngine(),
  );
}
