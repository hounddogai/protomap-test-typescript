import * as clock from "../../../../kit/clock.js";
import { WaitCycleValidator, defaultWaitCycleValidator } from "./wait-cycle-rules.js";
import { WaitCycleStore } from "./wait-cycle-store.js";

/** Moves wait cycles through their life cycle and keeps a journal of what it did. */
export class WaitCycleManager {
  store: WaitCycleStore;
  validator: WaitCycleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(store: WaitCycleStore, validator: WaitCycleValidator, clockValue: clock.Clock, journal: string[]) {
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
      throw new Error(`wait cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`wait cycle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  reviewStale(cutoff: number): number {
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

export function newWaitCycleManager(store: WaitCycleStore, clockValue: clock.Clock): WaitCycleManager {
  return new WaitCycleManager(store, defaultWaitCycleValidator(), clockValue, []);
}
