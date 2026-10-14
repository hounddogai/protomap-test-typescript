import * as clock from "../../../../kit/clock.js";
import { PlacementScoreEngine, defaultPlacementScoreEngine } from "./placement-score-engine.js";
import { PlacementScoreValidator, defaultPlacementScoreValidator } from "./placement-score-rules.js";
import { PlacementScoreStore } from "./placement-score-store.js";

/** Moves placement scores through their life cycle and keeps a journal of what it did. */
export class PlacementScoreDesk {
  store: PlacementScoreStore;
  validator: PlacementScoreValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PlacementScoreEngine;

  constructor(
    store: PlacementScoreStore,
    validator: PlacementScoreValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PlacementScoreEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`placement score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`placement score ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`placement score ${code} not found`);
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

export function newPlacementScoreDesk(store: PlacementScoreStore, clockValue: clock.Clock): PlacementScoreDesk {
  return new PlacementScoreDesk(store, defaultPlacementScoreValidator(), clockValue, [], defaultPlacementScoreEngine());
}
