import * as clock from "../../../../kit/clock.js";
import {
  WeightedPlacementEstimateValidator,
  defaultWeightedPlacementEstimateValidator,
} from "./weighted-placement-estimate-rules.js";
import { WeightedPlacementEstimateStore } from "./weighted-placement-estimate-store.js";

/** Moves weighted placement estimates through their life cycle and keeps a journal of what it did. */
export class WeightedPlacementEstimateManager {
  store: WeightedPlacementEstimateStore;
  validator: WeightedPlacementEstimateValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: WeightedPlacementEstimateStore,
    validator: WeightedPlacementEstimateValidator,
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
      throw new Error(`weighted placement estimate ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted placement estimate ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newWeightedPlacementEstimateManager(store: WeightedPlacementEstimateStore, clockValue: clock.Clock): WeightedPlacementEstimateManager {
  return new WeightedPlacementEstimateManager(store, defaultWeightedPlacementEstimateValidator(), clockValue, []);
}
