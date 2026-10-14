import * as clock from "../../../../kit/clock.js";
import { PlacementSlotValidator, defaultPlacementSlotValidator } from "./placement-slot-rules.js";
import { PlacementSlotStore } from "./placement-slot-store.js";

/** Moves placement slots through their life cycle and keeps a journal of what it did. */
export class PlacementSlotCoordinator {
  store: PlacementSlotStore;
  validator: PlacementSlotValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PlacementSlotStore,
    validator: PlacementSlotValidator,
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
      throw new Error(`placement slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`placement slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  reviewStale(cutoff: number): number {
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

export function newPlacementSlotCoordinator(store: PlacementSlotStore, clockValue: clock.Clock): PlacementSlotCoordinator {
  return new PlacementSlotCoordinator(store, defaultPlacementSlotValidator(), clockValue, []);
}
