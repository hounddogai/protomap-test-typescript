import * as clock from "../../../../kit/clock.js";
import { StrictCreativeSlotValidator, defaultStrictCreativeSlotValidator } from "./strict-creative-slot-rules.js";
import { StrictCreativeSlotStore } from "./strict-creative-slot-store.js";

/** Moves strict creative slots through their life cycle and keeps a journal of what it did. */
export class StrictCreativeSlotCoordinator {
  store: StrictCreativeSlotStore;
  validator: StrictCreativeSlotValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: StrictCreativeSlotStore,
    validator: StrictCreativeSlotValidator,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict creative slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict creative slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  sweep(cutoff: number): number {
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

export function newStrictCreativeSlotCoordinator(store: StrictCreativeSlotStore, clockValue: clock.Clock): StrictCreativeSlotCoordinator {
  return new StrictCreativeSlotCoordinator(store, defaultStrictCreativeSlotValidator(), clockValue, []);
}
