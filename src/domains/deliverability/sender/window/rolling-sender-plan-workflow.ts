import * as clock from "../../../../kit/clock.js";
import { RollingSenderPlanValidator, defaultRollingSenderPlanValidator } from "./rolling-sender-plan-rules.js";
import { RollingSenderPlanStore } from "./rolling-sender-plan-store.js";

/** Moves rolling sender plans through their life cycle and keeps a journal of what it did. */
export class RollingSenderPlanService {
  store: RollingSenderPlanStore;
  validator: RollingSenderPlanValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RollingSenderPlanStore,
    validator: RollingSenderPlanValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling sender plan ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling sender plan ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  sweep(cutoff: number): number {
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

export function newRollingSenderPlanService(store: RollingSenderPlanStore, clockValue: clock.Clock): RollingSenderPlanService {
  return new RollingSenderPlanService(store, defaultRollingSenderPlanValidator(), clockValue, []);
}
