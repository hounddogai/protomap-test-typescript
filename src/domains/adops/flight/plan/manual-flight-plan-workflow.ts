import * as clock from "../../../../kit/clock.js";
import { ManualFlightPlanValidator, defaultManualFlightPlanValidator } from "./manual-flight-plan-rules.js";
import { ManualFlightPlanStore } from "./manual-flight-plan-store.js";

/** Moves manual flight plans through their life cycle and keeps a journal of what it did. */
export class ManualFlightPlanManager {
  store: ManualFlightPlanStore;
  validator: ManualFlightPlanValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ManualFlightPlanStore,
    validator: ManualFlightPlanValidator,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual flight plan ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual flight plan ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
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

export function newManualFlightPlanManager(store: ManualFlightPlanStore, clockValue: clock.Clock): ManualFlightPlanManager {
  return new ManualFlightPlanManager(store, defaultManualFlightPlanValidator(), clockValue, []);
}
