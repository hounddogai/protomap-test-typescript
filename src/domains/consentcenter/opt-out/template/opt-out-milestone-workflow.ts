import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { OptOutMilestoneEngine, defaultOptOutMilestoneEngine } from "./opt-out-milestone-engine.js";
import { OptOutMilestoneValidator, defaultOptOutMilestoneValidator } from "./opt-out-milestone-rules.js";
import { OptOutMilestoneStore } from "./opt-out-milestone-store.js";

/** Moves opt out milestones through their life cycle and keeps a journal of what it did. */
export class OptOutMilestoneDesk {
  store: OptOutMilestoneStore;
  validator: OptOutMilestoneValidator;
  clock: clock.Clock;
  journal: string[];
  engine: OptOutMilestoneEngine;

  constructor(
    store: OptOutMilestoneStore,
    validator: OptOutMilestoneValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: OptOutMilestoneEngine,
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
      throw new Error(`opt out milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`opt out milestone ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`opt out milestone ${code} not found`);
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

export function newOptOutMilestoneDesk(store: OptOutMilestoneStore, clockValue: clock.Clock, flagsValue: flags.Registry): OptOutMilestoneDesk {
  return new OptOutMilestoneDesk(
    store,
    defaultOptOutMilestoneValidator(),
    clockValue,
    [],
    defaultOptOutMilestoneEngine(flagsValue),
  );
}
