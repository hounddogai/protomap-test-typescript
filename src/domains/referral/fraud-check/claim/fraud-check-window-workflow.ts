import * as clock from "../../../../kit/clock.js";
import { FraudCheckWindowValidator, defaultFraudCheckWindowValidator } from "./fraud-check-window-rules.js";
import { FraudCheckWindowStore } from "./fraud-check-window-store.js";

/** Moves fraud check windows through their life cycle and keeps a journal of what it did. */
export class FraudCheckWindowCoordinator {
  store: FraudCheckWindowStore;
  validator: FraudCheckWindowValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: FraudCheckWindowStore,
    validator: FraudCheckWindowValidator,
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
      throw new Error(`fraud check window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fraud check window ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newFraudCheckWindowCoordinator(store: FraudCheckWindowStore, clockValue: clock.Clock): FraudCheckWindowCoordinator {
  return new FraudCheckWindowCoordinator(store, defaultFraudCheckWindowValidator(), clockValue, []);
}
