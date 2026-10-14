import * as clock from "../../../../kit/clock.js";
import { RewardScheduleEngine, defaultRewardScheduleEngine } from "./reward-schedule-engine.js";
import { RewardScheduleValidator, defaultRewardScheduleValidator } from "./reward-schedule-rules.js";
import { RewardScheduleStore } from "./reward-schedule-store.js";

/** Moves reward schedules through their life cycle and keeps a journal of what it did. */
export class RewardScheduleDesk {
  store: RewardScheduleStore;
  validator: RewardScheduleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RewardScheduleEngine;

  constructor(
    store: RewardScheduleStore,
    validator: RewardScheduleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RewardScheduleEngine,
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
      throw new Error(`reward schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward schedule ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newRewardScheduleDesk(store: RewardScheduleStore, clockValue: clock.Clock): RewardScheduleDesk {
  return new RewardScheduleDesk(store, defaultRewardScheduleValidator(), clockValue, [], defaultRewardScheduleEngine());
}
