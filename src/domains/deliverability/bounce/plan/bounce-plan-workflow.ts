import * as clock from "../../../../kit/clock.js";
import { BouncePlanValidator, defaultBouncePlanValidator } from "./bounce-plan-rules.js";
import { BouncePlanStore } from "./bounce-plan-store.js";

/** Moves bounce plans through their life cycle and keeps a journal of what it did. */
export class BouncePlanManager {
  store: BouncePlanStore;
  validator: BouncePlanValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(store: BouncePlanStore, validator: BouncePlanValidator, clockValue: clock.Clock, journal: string[]) {
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
      throw new Error(`bounce plan ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bounce plan ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
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

export function newBouncePlanManager(store: BouncePlanStore, clockValue: clock.Clock): BouncePlanManager {
  return new BouncePlanManager(store, defaultBouncePlanValidator(), clockValue, []);
}
