import * as clock from "../../../../kit/clock.js";
import { BounceGroupValidator, defaultBounceGroupValidator } from "./bounce-group-rules.js";
import { BounceGroupStore } from "./bounce-group-store.js";

/** Moves bounce groups through their life cycle and keeps a journal of what it did. */
export class BounceGroupCoordinator {
  store: BounceGroupStore;
  validator: BounceGroupValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: BounceGroupStore,
    validator: BounceGroupValidator,
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
      throw new Error(`bounce group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bounce group ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
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

export function newBounceGroupCoordinator(store: BounceGroupStore, clockValue: clock.Clock): BounceGroupCoordinator {
  return new BounceGroupCoordinator(store, defaultBounceGroupValidator(), clockValue, []);
}
