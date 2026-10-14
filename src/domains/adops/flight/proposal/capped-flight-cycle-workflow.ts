import * as clock from "../../../../kit/clock.js";
import { CappedFlightCycleValidator, defaultCappedFlightCycleValidator } from "./capped-flight-cycle-rules.js";
import { CappedFlightCycleStore } from "./capped-flight-cycle-store.js";

/** Moves capped flight cycles through their life cycle and keeps a journal of what it did. */
export class CappedFlightCycleWorkflow {
  store: CappedFlightCycleStore;
  validator: CappedFlightCycleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: CappedFlightCycleStore,
    validator: CappedFlightCycleValidator,
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
      throw new Error(`capped flight cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped flight cycle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newCappedFlightCycleWorkflow(store: CappedFlightCycleStore, clockValue: clock.Clock): CappedFlightCycleWorkflow {
  return new CappedFlightCycleWorkflow(store, defaultCappedFlightCycleValidator(), clockValue, []);
}
