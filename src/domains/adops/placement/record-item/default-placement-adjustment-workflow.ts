import * as clock from "../../../../kit/clock.js";
import {
  DefaultPlacementAdjustmentEngine,
  defaultDefaultPlacementAdjustmentEngine,
} from "./default-placement-adjustment-engine.js";
import {
  DefaultPlacementAdjustmentValidator,
  defaultDefaultPlacementAdjustmentValidator,
} from "./default-placement-adjustment-rules.js";
import { DefaultPlacementAdjustmentStore } from "./default-placement-adjustment-store.js";

/** Moves default placement adjustments through their life cycle and keeps a journal of what it did. */
export class DefaultPlacementAdjustmentCoordinator {
  store: DefaultPlacementAdjustmentStore;
  validator: DefaultPlacementAdjustmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultPlacementAdjustmentEngine;

  constructor(
    store: DefaultPlacementAdjustmentStore,
    validator: DefaultPlacementAdjustmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultPlacementAdjustmentEngine,
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
      throw new Error(`default placement adjustment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default placement adjustment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default placement adjustment ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newDefaultPlacementAdjustmentCoordinator(store: DefaultPlacementAdjustmentStore, clockValue: clock.Clock): DefaultPlacementAdjustmentCoordinator {
  return new DefaultPlacementAdjustmentCoordinator(
    store,
    defaultDefaultPlacementAdjustmentValidator(),
    clockValue,
    [],
    defaultDefaultPlacementAdjustmentEngine(),
  );
}
