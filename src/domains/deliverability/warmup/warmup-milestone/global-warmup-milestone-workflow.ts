import * as clock from "../../../../kit/clock.js";
import { GlobalWarmupMilestoneEngine, defaultGlobalWarmupMilestoneEngine } from "./global-warmup-milestone-engine.js";
import {
  GlobalWarmupMilestoneValidator,
  defaultGlobalWarmupMilestoneValidator,
} from "./global-warmup-milestone-rules.js";
import { GlobalWarmupMilestoneStore } from "./global-warmup-milestone-store.js";

/** Moves global warmup milestones through their life cycle and keeps a journal of what it did. */
export class GlobalWarmupMilestoneDesk {
  store: GlobalWarmupMilestoneStore;
  validator: GlobalWarmupMilestoneValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalWarmupMilestoneEngine;

  constructor(
    store: GlobalWarmupMilestoneStore,
    validator: GlobalWarmupMilestoneValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalWarmupMilestoneEngine,
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
      throw new Error(`global warmup milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global warmup milestone ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global warmup milestone ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newGlobalWarmupMilestoneDesk(store: GlobalWarmupMilestoneStore, clockValue: clock.Clock): GlobalWarmupMilestoneDesk {
  return new GlobalWarmupMilestoneDesk(
    store,
    defaultGlobalWarmupMilestoneValidator(),
    clockValue,
    [],
    defaultGlobalWarmupMilestoneEngine(),
  );
}
