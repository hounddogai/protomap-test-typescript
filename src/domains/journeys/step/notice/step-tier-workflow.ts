import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { StepTierEngine, defaultStepTierEngine } from "./step-tier-engine.js";
import { StepTierValidator, defaultStepTierValidator } from "./step-tier-rules.js";
import { StepTierStore } from "./step-tier-store.js";

/** Moves step tiers through their life cycle and keeps a journal of what it did. */
export class StepTierCoordinator {
  store: StepTierStore;
  validator: StepTierValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StepTierEngine;

  constructor(
    store: StepTierStore,
    validator: StepTierValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StepTierEngine,
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
      throw new Error(`step tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`step tier ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`step tier ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newStepTierCoordinator(store: StepTierStore, clockValue: clock.Clock, flagsValue: flags.Registry): StepTierCoordinator {
  return new StepTierCoordinator(store, defaultStepTierValidator(), clockValue, [], defaultStepTierEngine(flagsValue));
}
