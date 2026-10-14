import * as clock from "../../../../kit/clock.js";
import { ManualJourneySlotValidator, defaultManualJourneySlotValidator } from "./manual-journey-slot-rules.js";
import { ManualJourneySlotStore } from "./manual-journey-slot-store.js";

/** Moves manual journey slots through their life cycle and keeps a journal of what it did. */
export class ManualJourneySlotManager {
  store: ManualJourneySlotStore;
  validator: ManualJourneySlotValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ManualJourneySlotStore,
    validator: ManualJourneySlotValidator,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual journey slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual journey slot ${code} not found`);
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
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newManualJourneySlotManager(store: ManualJourneySlotStore, clockValue: clock.Clock): ManualJourneySlotManager {
  return new ManualJourneySlotManager(store, defaultManualJourneySlotValidator(), clockValue, []);
}
