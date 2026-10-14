import * as clock from "../../../../kit/clock.js";
import {
  SeasonalJourneyRequestEngine,
  defaultSeasonalJourneyRequestEngine,
} from "./seasonal-journey-request-engine.js";
import {
  SeasonalJourneyRequestValidator,
  defaultSeasonalJourneyRequestValidator,
} from "./seasonal-journey-request-rules.js";
import { SeasonalJourneyRequestStore } from "./seasonal-journey-request-store.js";

/** Moves seasonal journey requests through their life cycle and keeps a journal of what it did. */
export class SeasonalJourneyRequestDesk {
  store: SeasonalJourneyRequestStore;
  validator: SeasonalJourneyRequestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalJourneyRequestEngine;

  constructor(
    store: SeasonalJourneyRequestStore,
    validator: SeasonalJourneyRequestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalJourneyRequestEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal journey request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal journey request ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal journey request ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newSeasonalJourneyRequestDesk(store: SeasonalJourneyRequestStore, clockValue: clock.Clock): SeasonalJourneyRequestDesk {
  return new SeasonalJourneyRequestDesk(
    store,
    defaultSeasonalJourneyRequestValidator(),
    clockValue,
    [],
    defaultSeasonalJourneyRequestEngine(),
  );
}
