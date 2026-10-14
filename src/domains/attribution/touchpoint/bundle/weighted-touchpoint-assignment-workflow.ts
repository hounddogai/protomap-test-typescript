import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  WeightedTouchpointAssignmentEngine,
  defaultWeightedTouchpointAssignmentEngine,
} from "./weighted-touchpoint-assignment-engine.js";
import {
  WeightedTouchpointAssignmentValidator,
  defaultWeightedTouchpointAssignmentValidator,
} from "./weighted-touchpoint-assignment-rules.js";
import { WeightedTouchpointAssignmentStore } from "./weighted-touchpoint-assignment-store.js";

/** Moves weighted touchpoint assignments through their life cycle and keeps a journal of what it did. */
export class WeightedTouchpointAssignmentCoordinator {
  store: WeightedTouchpointAssignmentStore;
  validator: WeightedTouchpointAssignmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedTouchpointAssignmentEngine;

  constructor(
    store: WeightedTouchpointAssignmentStore,
    validator: WeightedTouchpointAssignmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedTouchpointAssignmentEngine,
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
      throw new Error(`weighted touchpoint assignment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted touchpoint assignment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted touchpoint assignment ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newWeightedTouchpointAssignmentCoordinator(store: WeightedTouchpointAssignmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): WeightedTouchpointAssignmentCoordinator {
  return new WeightedTouchpointAssignmentCoordinator(
    store,
    defaultWeightedTouchpointAssignmentValidator(),
    clockValue,
    [],
    defaultWeightedTouchpointAssignmentEngine(flagsValue),
  );
}
