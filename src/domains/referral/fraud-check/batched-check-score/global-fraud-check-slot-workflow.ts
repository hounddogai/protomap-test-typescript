import * as clock from "../../../../kit/clock.js";
import {
  GlobalFraudCheckSlotValidator,
  defaultGlobalFraudCheckSlotValidator,
} from "./global-fraud-check-slot-rules.js";
import { GlobalFraudCheckSlotStore } from "./global-fraud-check-slot-store.js";

/** Moves global fraud check slots through their life cycle and keeps a journal of what it did. */
export class GlobalFraudCheckSlotCoordinator {
  store: GlobalFraudCheckSlotStore;
  validator: GlobalFraudCheckSlotValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: GlobalFraudCheckSlotStore,
    validator: GlobalFraudCheckSlotValidator,
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
      throw new Error(`global fraud check slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global fraud check slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
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

export function newGlobalFraudCheckSlotCoordinator(store: GlobalFraudCheckSlotStore, clockValue: clock.Clock): GlobalFraudCheckSlotCoordinator {
  return new GlobalFraudCheckSlotCoordinator(store, defaultGlobalFraudCheckSlotValidator(), clockValue, []);
}
