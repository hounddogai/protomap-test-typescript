import * as clock from "../../../../kit/clock.js";
import { PlacementThresholdValidator, defaultPlacementThresholdValidator } from "./placement-threshold-rules.js";
import { PlacementThresholdStore } from "./placement-threshold-store.js";

/** Moves placement thresholds through their life cycle and keeps a journal of what it did. */
export class PlacementThresholdCoordinator {
  store: PlacementThresholdStore;
  validator: PlacementThresholdValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PlacementThresholdStore,
    validator: PlacementThresholdValidator,
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
      throw new Error(`placement threshold ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`placement threshold ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
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

export function newPlacementThresholdCoordinator(store: PlacementThresholdStore, clockValue: clock.Clock): PlacementThresholdCoordinator {
  return new PlacementThresholdCoordinator(store, defaultPlacementThresholdValidator(), clockValue, []);
}
