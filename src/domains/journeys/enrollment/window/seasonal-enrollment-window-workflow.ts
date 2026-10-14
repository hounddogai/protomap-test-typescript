import * as clock from "../../../../kit/clock.js";
import {
  SeasonalEnrollmentWindowEngine,
  defaultSeasonalEnrollmentWindowEngine,
} from "./seasonal-enrollment-window-engine.js";
import {
  SeasonalEnrollmentWindowValidator,
  defaultSeasonalEnrollmentWindowValidator,
} from "./seasonal-enrollment-window-rules.js";
import { SeasonalEnrollmentWindowStore } from "./seasonal-enrollment-window-store.js";

/** Moves seasonal enrollment windows through their life cycle and keeps a journal of what it did. */
export class SeasonalEnrollmentWindowManager {
  store: SeasonalEnrollmentWindowStore;
  validator: SeasonalEnrollmentWindowValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalEnrollmentWindowEngine;

  constructor(
    store: SeasonalEnrollmentWindowStore,
    validator: SeasonalEnrollmentWindowValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalEnrollmentWindowEngine,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal enrollment window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal enrollment window ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal enrollment window ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newSeasonalEnrollmentWindowManager(store: SeasonalEnrollmentWindowStore, clockValue: clock.Clock): SeasonalEnrollmentWindowManager {
  return new SeasonalEnrollmentWindowManager(
    store,
    defaultSeasonalEnrollmentWindowValidator(),
    clockValue,
    [],
    defaultSeasonalEnrollmentWindowEngine(),
  );
}
