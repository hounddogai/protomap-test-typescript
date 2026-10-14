import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BadgeMilestoneEngine, defaultBadgeMilestoneEngine } from "./badge-milestone-engine.js";
import { BadgeMilestoneValidator, defaultBadgeMilestoneValidator } from "./badge-milestone-rules.js";
import { BadgeMilestoneStore } from "./badge-milestone-store.js";

/** Moves badge milestones through their life cycle and keeps a journal of what it did. */
export class BadgeMilestoneDesk {
  store: BadgeMilestoneStore;
  validator: BadgeMilestoneValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BadgeMilestoneEngine;

  constructor(
    store: BadgeMilestoneStore,
    validator: BadgeMilestoneValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BadgeMilestoneEngine,
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
      throw new Error(`badge milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`badge milestone ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`badge milestone ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newBadgeMilestoneDesk(store: BadgeMilestoneStore, clockValue: clock.Clock, flagsValue: flags.Registry): BadgeMilestoneDesk {
  return new BadgeMilestoneDesk(
    store,
    defaultBadgeMilestoneValidator(),
    clockValue,
    [],
    defaultBadgeMilestoneEngine(flagsValue),
  );
}
