import * as clock from "../../../../kit/clock.js";
import { GlobalOptOutSlotValidator, defaultGlobalOptOutSlotValidator } from "./global-opt-out-slot-rules.js";
import { GlobalOptOutSlotStore } from "./global-opt-out-slot-store.js";

/** Moves global opt out slots through their life cycle and keeps a journal of what it did. */
export class GlobalOptOutSlotService {
  store: GlobalOptOutSlotStore;
  validator: GlobalOptOutSlotValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: GlobalOptOutSlotStore,
    validator: GlobalOptOutSlotValidator,
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
      throw new Error(`global opt out slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global opt out slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newGlobalOptOutSlotService(store: GlobalOptOutSlotStore, clockValue: clock.Clock): GlobalOptOutSlotService {
  return new GlobalOptOutSlotService(store, defaultGlobalOptOutSlotValidator(), clockValue, []);
}
