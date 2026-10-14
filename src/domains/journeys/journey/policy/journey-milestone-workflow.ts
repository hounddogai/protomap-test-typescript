import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { JourneyMilestoneEngine, defaultJourneyMilestoneEngine } from "./journey-milestone-engine.js";
import { JourneyMilestoneValidator, defaultJourneyMilestoneValidator } from "./journey-milestone-rules.js";
import { JourneyMilestoneStore } from "./journey-milestone-store.js";

/** Moves journey milestones through their life cycle and keeps a journal of what it did. */
export class JourneyMilestoneManager {
  store: JourneyMilestoneStore;
  validator: JourneyMilestoneValidator;
  clock: clock.Clock;
  journal: string[];
  engine: JourneyMilestoneEngine;

  constructor(
    store: JourneyMilestoneStore,
    validator: JourneyMilestoneValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: JourneyMilestoneEngine,
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
      throw new Error(`journey milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`journey milestone ${code} not found`);
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
      throw new Error(`journey milestone ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newJourneyMilestoneManager(store: JourneyMilestoneStore, clockValue: clock.Clock, flagsValue: flags.Registry): JourneyMilestoneManager {
  return new JourneyMilestoneManager(
    store,
    defaultJourneyMilestoneValidator(),
    clockValue,
    [],
    defaultJourneyMilestoneEngine(flagsValue),
  );
}
