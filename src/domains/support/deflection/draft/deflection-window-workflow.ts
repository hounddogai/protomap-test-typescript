import * as clock from "../../../../kit/clock.js";
import { DeflectionWindowValidator, defaultDeflectionWindowValidator } from "./deflection-window-rules.js";
import { DeflectionWindowStore } from "./deflection-window-store.js";

/** Moves deflection windows through their life cycle and keeps a journal of what it did. */
export class DeflectionWindowManager {
  store: DeflectionWindowStore;
  validator: DeflectionWindowValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: DeflectionWindowStore,
    validator: DeflectionWindowValidator,
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
      throw new Error(`deflection window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`deflection window ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
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

export function newDeflectionWindowManager(store: DeflectionWindowStore, clockValue: clock.Clock): DeflectionWindowManager {
  return new DeflectionWindowManager(store, defaultDeflectionWindowValidator(), clockValue, []);
}
