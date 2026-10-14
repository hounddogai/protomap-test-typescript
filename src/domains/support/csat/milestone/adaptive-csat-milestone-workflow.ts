import * as clock from "../../../../kit/clock.js";
import { AdaptiveCsatMilestoneEngine, defaultAdaptiveCsatMilestoneEngine } from "./adaptive-csat-milestone-engine.js";
import {
  AdaptiveCsatMilestoneValidator,
  defaultAdaptiveCsatMilestoneValidator,
} from "./adaptive-csat-milestone-rules.js";
import { AdaptiveCsatMilestoneStore } from "./adaptive-csat-milestone-store.js";

/** Moves adaptive csat milestones through their life cycle and keeps a journal of what it did. */
export class AdaptiveCsatMilestoneCoordinator {
  store: AdaptiveCsatMilestoneStore;
  validator: AdaptiveCsatMilestoneValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveCsatMilestoneEngine;

  constructor(
    store: AdaptiveCsatMilestoneStore,
    validator: AdaptiveCsatMilestoneValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveCsatMilestoneEngine,
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
      throw new Error(`adaptive csat milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive csat milestone ${code} not found`);
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
      throw new Error(`adaptive csat milestone ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newAdaptiveCsatMilestoneCoordinator(store: AdaptiveCsatMilestoneStore, clockValue: clock.Clock): AdaptiveCsatMilestoneCoordinator {
  return new AdaptiveCsatMilestoneCoordinator(
    store,
    defaultAdaptiveCsatMilestoneValidator(),
    clockValue,
    [],
    defaultAdaptiveCsatMilestoneEngine(),
  );
}
