import * as clock from "../../../../kit/clock.js";
import {
  SeasonalSenderMilestoneEngine,
  defaultSeasonalSenderMilestoneEngine,
} from "./seasonal-sender-milestone-engine.js";
import {
  SeasonalSenderMilestoneValidator,
  defaultSeasonalSenderMilestoneValidator,
} from "./seasonal-sender-milestone-rules.js";
import { SeasonalSenderMilestoneStore } from "./seasonal-sender-milestone-store.js";

/** Moves seasonal sender milestones through their life cycle and keeps a journal of what it did. */
export class SeasonalSenderMilestoneManager {
  store: SeasonalSenderMilestoneStore;
  validator: SeasonalSenderMilestoneValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalSenderMilestoneEngine;

  constructor(
    store: SeasonalSenderMilestoneStore,
    validator: SeasonalSenderMilestoneValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalSenderMilestoneEngine,
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
      throw new Error(`seasonal sender milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal sender milestone ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal sender milestone ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newSeasonalSenderMilestoneManager(store: SeasonalSenderMilestoneStore, clockValue: clock.Clock): SeasonalSenderMilestoneManager {
  return new SeasonalSenderMilestoneManager(
    store,
    defaultSeasonalSenderMilestoneValidator(),
    clockValue,
    [],
    defaultSeasonalSenderMilestoneEngine(),
  );
}
