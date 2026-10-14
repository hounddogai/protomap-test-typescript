import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RetentionPlanEngine, defaultRetentionPlanEngine } from "./retention-plan-engine.js";
import { RetentionPlanValidator, defaultRetentionPlanValidator } from "./retention-plan-rules.js";
import { RetentionPlanStore } from "./retention-plan-store.js";

/** Moves retention plans through their life cycle and keeps a journal of what it did. */
export class RetentionPlanCoordinator {
  store: RetentionPlanStore;
  validator: RetentionPlanValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RetentionPlanEngine;

  constructor(
    store: RetentionPlanStore,
    validator: RetentionPlanValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RetentionPlanEngine,
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
      throw new Error(`retention plan ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`retention plan ${code} not found`);
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
      throw new Error(`retention plan ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRetentionPlanCoordinator(store: RetentionPlanStore, clockValue: clock.Clock, flagsValue: flags.Registry): RetentionPlanCoordinator {
  return new RetentionPlanCoordinator(
    store,
    defaultRetentionPlanValidator(),
    clockValue,
    [],
    defaultRetentionPlanEngine(flagsValue),
  );
}
