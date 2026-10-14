import * as clock from "../../../../kit/clock.js";
import {
  SeasonalConversionSlotValidator,
  defaultSeasonalConversionSlotValidator,
} from "./seasonal-conversion-slot-rules.js";
import { SeasonalConversionSlotStore } from "./seasonal-conversion-slot-store.js";

/** Moves seasonal conversion slots through their life cycle and keeps a journal of what it did. */
export class SeasonalConversionSlotCoordinator {
  store: SeasonalConversionSlotStore;
  validator: SeasonalConversionSlotValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: SeasonalConversionSlotStore,
    validator: SeasonalConversionSlotValidator,
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
      throw new Error(`seasonal conversion slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal conversion slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
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

export function newSeasonalConversionSlotCoordinator(store: SeasonalConversionSlotStore, clockValue: clock.Clock): SeasonalConversionSlotCoordinator {
  return new SeasonalConversionSlotCoordinator(store, defaultSeasonalConversionSlotValidator(), clockValue, []);
}
