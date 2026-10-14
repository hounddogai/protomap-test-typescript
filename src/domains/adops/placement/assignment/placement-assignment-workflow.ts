import * as clock from "../../../../kit/clock.js";
import { PlacementAssignmentEngine, defaultPlacementAssignmentEngine } from "./placement-assignment-engine.js";
import { PlacementAssignmentValidator, defaultPlacementAssignmentValidator } from "./placement-assignment-rules.js";
import { PlacementAssignmentStore } from "./placement-assignment-store.js";

/** Moves placement assignments through their life cycle and keeps a journal of what it did. */
export class PlacementAssignmentManager {
  store: PlacementAssignmentStore;
  validator: PlacementAssignmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PlacementAssignmentEngine;

  constructor(
    store: PlacementAssignmentStore,
    validator: PlacementAssignmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PlacementAssignmentEngine,
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
      throw new Error(`placement assignment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`placement assignment ${code} not found`);
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
      throw new Error(`placement assignment ${code} not found`);
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

export function newPlacementAssignmentManager(store: PlacementAssignmentStore, clockValue: clock.Clock): PlacementAssignmentManager {
  return new PlacementAssignmentManager(
    store,
    defaultPlacementAssignmentValidator(),
    clockValue,
    [],
    defaultPlacementAssignmentEngine(),
  );
}
