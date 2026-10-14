import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RetentionMilestoneEngine, defaultRetentionMilestoneEngine } from "./retention-milestone-engine.js";
import { RetentionMilestoneValidator, defaultRetentionMilestoneValidator } from "./retention-milestone-rules.js";
import { RetentionMilestoneStore } from "./retention-milestone-store.js";

/** Moves retention milestones through their life cycle and keeps a journal of what it did. */
export class RetentionMilestoneDesk {
  store: RetentionMilestoneStore;
  validator: RetentionMilestoneValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RetentionMilestoneEngine;

  constructor(
    store: RetentionMilestoneStore,
    validator: RetentionMilestoneValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RetentionMilestoneEngine,
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
      throw new Error(`retention milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`retention milestone ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`retention milestone ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRetentionMilestoneDesk(store: RetentionMilestoneStore, clockValue: clock.Clock, flagsValue: flags.Registry): RetentionMilestoneDesk {
  return new RetentionMilestoneDesk(
    store,
    defaultRetentionMilestoneValidator(),
    clockValue,
    [],
    defaultRetentionMilestoneEngine(flagsValue),
  );
}
