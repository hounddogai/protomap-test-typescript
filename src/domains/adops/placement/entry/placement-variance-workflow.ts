import * as clock from "../../../../kit/clock.js";
import { PlacementVarianceEngine, defaultPlacementVarianceEngine } from "./placement-variance-engine.js";
import { PlacementVarianceValidator, defaultPlacementVarianceValidator } from "./placement-variance-rules.js";
import { PlacementVarianceStore } from "./placement-variance-store.js";

/** Moves placement variances through their life cycle and keeps a journal of what it did. */
export class PlacementVarianceWorkflow {
  store: PlacementVarianceStore;
  validator: PlacementVarianceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PlacementVarianceEngine;

  constructor(
    store: PlacementVarianceStore,
    validator: PlacementVarianceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PlacementVarianceEngine,
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
      throw new Error(`placement variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`placement variance ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`placement variance ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newPlacementVarianceWorkflow(store: PlacementVarianceStore, clockValue: clock.Clock): PlacementVarianceWorkflow {
  return new PlacementVarianceWorkflow(
    store,
    defaultPlacementVarianceValidator(),
    clockValue,
    [],
    defaultPlacementVarianceEngine(),
  );
}
