import * as clock from "../../../../kit/clock.js";
import { SeasonalBadgeSlotEngine, defaultSeasonalBadgeSlotEngine } from "./seasonal-badge-slot-engine.js";
import { SeasonalBadgeSlotValidator, defaultSeasonalBadgeSlotValidator } from "./seasonal-badge-slot-rules.js";
import { SeasonalBadgeSlotStore } from "./seasonal-badge-slot-store.js";

/** Moves seasonal badge slots through their life cycle and keeps a journal of what it did. */
export class SeasonalBadgeSlotWorkflow {
  store: SeasonalBadgeSlotStore;
  validator: SeasonalBadgeSlotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalBadgeSlotEngine;

  constructor(
    store: SeasonalBadgeSlotStore,
    validator: SeasonalBadgeSlotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalBadgeSlotEngine,
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
    this.engine = engine;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal badge slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal badge slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal badge slot ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newSeasonalBadgeSlotWorkflow(store: SeasonalBadgeSlotStore, clockValue: clock.Clock): SeasonalBadgeSlotWorkflow {
  return new SeasonalBadgeSlotWorkflow(
    store,
    defaultSeasonalBadgeSlotValidator(),
    clockValue,
    [],
    defaultSeasonalBadgeSlotEngine(),
  );
}
